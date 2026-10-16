"""List types of the five parent tables that are defined only under Resources/DLC/*/ (not in Base)."""
import os, re, sys, json, sqlite3, collections
ROOT = sys.argv[1]   # civilization_vii_1.5.0_game_files/Resources
DB = sys.argv[2]
OUT = sys.argv[3]
TABLES = {  # table -> key column
    'Units': 'UnitType', 'Leaders': 'LeaderType', 'Civilizations': 'CivilizationType',
    'Constructibles': 'ConstructibleType', 'Resources': 'ResourceType',
}
tok = re.compile(r'\b[A-Z][A-Z0-9_]{2,}\b')
def scan(base):
    """Every token that appears as a Type= / <Type> definition or a parent-table key in XML/SQL under base."""
    found = set()
    for dp, dn, fn in os.walk(base):
        for f in fn:
            if not f.endswith(('.xml', '.sql')):
                continue
            p = os.path.join(dp, f)
            if '/l10n/' in p or '/text/' in p or '/config/' in p:
                continue  # text and frontend config name units without defining them
            s = open(p, encoding='utf-8', errors='replace').read()
            # Types rows in XML, attribute or element form
            for m in re.finditer(r'<Types>(.*?)</Types>', s, re.S):
                found.update(re.findall(r'Type="([A-Z0-9_]+)"', m.group(1)))
                found.update(re.findall(r'<Type>([A-Z0-9_]+)</Type>', m.group(1)))
            for t, k in TABLES.items():
                for m in re.finditer(r'<%s>(.*?)</%s>' % (t, t), s, re.S):
                    found.update(re.findall(r'%s="([A-Z0-9_]+)"' % k, m.group(1)))
            # SQL inserts into Types or the parent tables
            for m in re.finditer(r'INSERT[^;]*?INTO\s+(Types|Units|Leaders|Civilizations|Constructibles|Resources)\b[^;]*;', s, re.S | re.I):
                found.update(re.findall(r"'([A-Z][A-Z0-9_]+)'", m.group(0)))
    return found
base = scan(os.path.join(ROOT, 'Base'))
dlc_by = {}
for d in sorted(os.listdir(os.path.join(ROOT, 'DLC'))):
    dlc_by[d] = scan(os.path.join(ROOT, 'DLC', d))
con = sqlite3.connect('file:%s?mode=ro' % DB, uri=True)
result = collections.OrderedDict()
for t, k in TABLES.items():
    keys = [r[0] for r in con.execute('SELECT %s FROM %s' % (k, t))]
    rows = []
    for key in keys:
        if key in base:
            continue
        owners = [d for d, s in dlc_by.items() if key in s]
        if owners:
            rows.append((key, owners))
    result[t] = rows
unknown = {}
for t, k in TABLES.items():
    keys = [r[0] for r in con.execute('SELECT %s FROM %s' % (k, t))]
    unk = [key for key in keys if key not in base and not any(key in s for s in dlc_by.values())]
    unknown[t] = unk
json.dump({'dlc_only': result, 'neither': unknown}, open(OUT, 'w'), indent=1)
for t in TABLES:
    print(t, 'total', con.execute('SELECT count(*) FROM %s' % t).fetchone()[0], 'dlc-only', len(result[t]), 'in neither base nor DLC files', len(unknown[t]))
