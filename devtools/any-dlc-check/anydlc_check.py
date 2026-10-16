"""Offline any-DLC check for Strategic Resources That Matter.

usage: anydlc_check.py ORIG_DB WORK_DB DLC_TYPES_JSON REPO [--ref GITREF] [--files f1,f2,...] [--extra f1,f2,...]

1. Copy ORIG_DB to WORK_DB, foreign keys off, cascade-on-delete triggers dropped (so deleting a parent leaves its
   children behind for the check to see, as a missing DLC would).
2. Delete every DLC-only parent (Units, Leaders, Civilizations, Constructibles, Resources) and its Types row.
3. Baseline PRAGMA foreign_key_check.
4. Delete the mod's own rows (TypeTags by the mod's tags; every row its XML files write, by primary key).
5. Reload the mod's files in modinfo order (from the working tree, or from GITREF), rerun the check, compare.
6. Diff the mod's reloaded rows against the rows the engine compiled.
"""
import sys, os, json, shutil, sqlite3, subprocess, collections, argparse
sys.dont_write_bytecode = True  # keep __pycache__ out of the repo
sys.path.insert(0, os.path.dirname(__file__))
import civ_loader as L

ap = argparse.ArgumentParser()
ap.add_argument('orig'); ap.add_argument('work'); ap.add_argument('dlc'); ap.add_argument('repo')
ap.add_argument('--ref', default=None)
ap.add_argument('--files', default='data/sr-tags.xml,data/sr-civilopedia.xml,data/sr-notification.xml,'
                'data/sr-antiquity-supply.sql,data/sr-antiquity-standard-modifiers.xml,'
                'data/sr-antiquity-standard-game.xml,data/sr-antiquity-curve-modifiers.xml,'
                'data/sr-antiquity-curve-game.xml')
ap.add_argument('--extra', default='', help='files loaded after the main set, in a second check')
a = ap.parse_args()

TABLES = {'Units': 'UnitType', 'Leaders': 'LeaderType', 'Civilizations': 'CivilizationType',
          'Constructibles': 'ConstructibleType', 'Resources': 'ResourceType'}


def read(rel):
    if a.ref:
        return subprocess.run(['git', '-C', a.repo, 'show', '%s:%s' % (a.ref, rel)], capture_output=True,
                              text=True, check=True).stdout
    return open(os.path.join(a.repo, rel), encoding='utf-8').read()


MISMATCH = set()


def fk_violations(con):
    """foreign_key_check rows as content keys: (child table, fk column(s), value(s), parent table)."""
    fkcols = {}
    out = collections.Counter()
    rows = []
    for (tname,) in con.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall():
        try:
            rows.extend(con.execute('PRAGMA foreign_key_check("%s")' % tname).fetchall())
        except sqlite3.OperationalError as e:
            MISMATCH.add('%s: %s' % (tname, e))
    for table, rowid, parent, fkid in rows:
        if table not in fkcols:
            fkcols[table] = collections.defaultdict(list)
            for r in con.execute('PRAGMA foreign_key_list("%s")' % table):
                fkcols[table][r[0]].append(r[3])
        cols = fkcols[table][fkid]
        if rowid is None:
            vals = ('?',)
        else:
            vals = con.execute('SELECT %s FROM "%s" WHERE rowid=?' % (','.join('"%s"' % c for c in cols), table),
                               (rowid,)).fetchone()
        out[(table, ','.join(cols), '|'.join(str(v) for v in vals), parent)] += 1
    return out


def summarize(v, label):
    by = collections.Counter()
    for (t, c, val, p), n in v.items():
        by[(t, c, p)] += n
    print('%s: %d rows' % (label, sum(v.values())))
    for k, n in sorted(by.items(), key=lambda x: -x[1])[:60]:
        print('   %5d  %s.%s -> %s' % (n, k[0], k[1], k[2]))


shutil.copyfile(a.orig, a.work)
con = L.connect(a.work)
trig = [r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'OnDelete%'")]
for t in trig:
    con.execute('DROP TRIGGER "%s"' % t)
print('dropped %d cascade-on-delete triggers on the copy' % len(trig))

dlc = json.load(open(a.dlc))['dlc_only']
print('\n== Step 1: delete DLC-only parents')
dlc_types = set()
for table, rows in dlc.items():
    key = TABLES[table]
    n = nt = 0
    for t, owners in rows:
        n += con.execute('DELETE FROM "%s" WHERE "%s"=?' % (table, key), (t,)).rowcount
        nt += con.execute('DELETE FROM Types WHERE Type=?', (t,)).rowcount
        dlc_types.add(t)
    print('   %-15s %3d rows deleted, %3d Types rows' % (table, n, nt))
print('   UNIT_HWARANG still in Types:', con.execute("SELECT count(*) FROM Types WHERE Type='UNIT_HWARANG'").fetchone()[0],
      ' in Units:', con.execute("SELECT count(*) FROM Units WHERE UnitType='UNIT_HWARANG'").fetchone()[0])
con.commit()

base = fk_violations(con)
print('tables whose foreign keys the check cannot read (schema mismatch, same before and after):')
for m in sorted(MISMATCH):
    print('   ', m)
print('\n== Step 2: baseline foreign_key_check (DLC parents gone, mod rows as compiled)')
summarize(base, 'baseline')

files = [f for f in a.files.split(',') if f]
# The mod's tags (sr-tags.xml) and every row its XML files write, found by loading them into an empty schema.
mod_tags = [r.get('Tag') for r in L.ET.fromstring(read('data/sr-tags.xml')).iter('Row')]
shadow = L.connect(':memory:')
for (sql,) in con.execute("SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL"):
    shadow.execute(sql)
for (sql,) in con.execute("SELECT sql FROM sqlite_master WHERE type='trigger' AND name IN "
                          "('OnTypeInsert','OnTagInsert')"):
    shadow.execute(sql)
for f in files:
    if not f.endswith('.sql'):
        L.load_file(shadow, f, read(f))
mod_rows = {}
for (t,) in shadow.execute("SELECT name FROM sqlite_master WHERE type='table'"):
    rows = shadow.execute('SELECT * FROM "%s"' % t).fetchall()
    if rows:
        mod_rows[t] = rows


def pkcols(c, t):
    info = c.execute('PRAGMA table_info("%s")' % t).fetchall()
    pk = [r[1] for r in sorted(info, key=lambda r: r[5]) if r[5]]
    return pk or [r[1] for r in info], [r[1] for r in info]


def mod_snapshot(c):
    """The mod's rows as they stand in DB c: by the shadow's primary keys, plus TypeTags by the mod's tags."""
    snap = {}
    for t, rows in mod_rows.items():
        pk, cols = pkcols(shadow, t)
        idx = [cols.index(k) for k in pk]
        got = []
        for r in rows:
            q = c.execute('SELECT * FROM "%s" WHERE %s' % (t, ' AND '.join('"%s" IS ?' % k for k in pk)),
                          [r[i] for i in idx]).fetchall()
            got.extend(q)
        snap[t] = sorted(got, key=repr)
    snap['TypeTags(mod tags)'] = sorted(c.execute('SELECT * FROM TypeTags WHERE Tag IN (%s)' % ','.join(
        '?' * len(mod_tags)), mod_tags).fetchall())
    return snap


orig = sqlite3.connect('file:%s?mode=ro' % a.orig, uri=True)
before = mod_snapshot(orig)

print('\n== Step 3: delete the mod\'s own rows')
n = con.execute('DELETE FROM TypeTags WHERE Tag IN (%s)' % ','.join('?' * len(mod_tags)), mod_tags).rowcount
print('   %-34s %5d' % ('TypeTags (the mod\'s 30 tags)', n))
for t, rows in sorted(mod_rows.items()):
    pk, cols = pkcols(shadow, t)
    idx = [cols.index(k) for k in pk]
    d = 0
    for r in rows:
        d += con.execute('DELETE FROM "%s" WHERE %s' % (t, ' AND '.join('"%s" IS ?' % k for k in pk)),
                         [r[i] for i in idx]).rowcount
    print('   %-34s %5d (files write %d)' % (t, d, len(rows)))
left = con.execute("SELECT count(*) FROM TypeTags WHERE Tag LIKE 'SR\\_%' ESCAPE '\\'").fetchone()[0]
print('   TypeTags with an SR_ tag left:', left)
con.commit()
free = fk_violations(con)
print('   foreign_key_check with the mod rows gone: %d rows (baseline %d)' % (sum(free.values()), sum(base.values())))

print('\n== Step 4: reload %s in modinfo order%s' % ('the working tree' if not a.ref else a.ref,
                                                    '' if not a.ref else ' (git)'))
for f in files:
    try:
        L.load_file(con, f, read(f))
        print('   loaded', f)
    except sqlite3.Error as e:
        print('   ERROR', f, e)
con.commit()
after = fk_violations(con)
print('\n== Step 5: foreign_key_check after the reload')
summarize(after, 'after')
new = after - base
print('\n   rows not in the baseline:', sum(new.values()))
for k, n in sorted(new.items())[:80]:
    print('     ', n, k)
gone = base - after
print('   baseline rows gone after the reload:', sum(gone.values()))
for k, n in sorted(gone.items())[:80]:
    print('     ', n, k)
newfree = after - free
print('   rows not in the mod-free check: %d' % sum(newfree.values()))
for k, n in sorted(newfree.items())[:40]:
    print('     ', n, k)
bad = con.execute('SELECT Tag, Type FROM TypeTags WHERE Tag IN (%s) AND Type NOT IN (SELECT Type FROM Types)' %
                  ','.join('?' * len(mod_tags)), mod_tags).fetchall()
print('   mod TypeTags rows whose Type is missing: %d %s' % (len(bad), sorted(bad)))
print('   UNIT_HWARANG tag rows (any SR_ tag):', con.execute(
    "SELECT count(*) FROM TypeTags WHERE Type LIKE 'UNIT_HWARANG%' AND Tag LIKE 'SR\\_%' ESCAPE '\\'").fetchone()[0])

print('\n== Step 6: the mod\'s rows after the reload against the rows the engine compiled')
aft = mod_snapshot(con)
for t in sorted(before):
    b, c = collections.Counter(before[t]), collections.Counter(aft[t])
    miss, extra = b - c, c - b
    flag = 'same' if not miss and not extra else 'DIFF'
    print('   %-34s compiled %5d  reloaded %5d  %s' % (t, len(before[t]), len(aft[t]), flag))
    for r in list(miss)[:6]:
        print('       only in compiled:', r)
    for r in list(extra)[:6]:
        print('       only in reload:  ', r)
    if t.startswith('TypeTags') and miss:
        on_dlc = [r for r in miss if r[1] in dlc_types]
        print('       of %d only-in-compiled TypeTags rows, %d are on DLC-only units' % (sum(miss.values()), len(on_dlc)))

if a.extra:
    print('\n== Extra: load %s on top and check again' % a.extra)
    for f in a.extra.split(','):
        try:
            L.load_file(con, f, read(f))
            print('   loaded', f)
        except sqlite3.Error as e:
            print('   ERROR', f, e)
    con.commit()
    ex = fk_violations(con)
    newx = ex - base
    print('   foreign_key_check rows: %d; not in the baseline: %d' % (sum(ex.values()), sum(newx.values())))
    for k, n in sorted(newx.items())[:40]:
        print('     ', n, k)
    print('   UNIT_HWARANG tag rows (any SR_ tag):', con.execute(
        "SELECT count(*) FROM TypeTags WHERE Type LIKE 'UNIT_HWARANG%' AND Tag LIKE 'SR\\_%' ESCAPE '\\'").fetchone()[0])
    print('   Units with StrategicResource set:', con.execute(
        'SELECT count(*) FROM Units WHERE StrategicResource IS NOT NULL').fetchone()[0])
