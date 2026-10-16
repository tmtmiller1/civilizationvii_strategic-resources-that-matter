"""Load Civilization VII mod data files (Database XML, GameEffects XML, SQL) into a SQLite gameplay DB.

Enough of the game's loader for an offline foreign-key check: Row / Replace / Update / Delete in Database XML, and the
GameEffects modifier shape compiled the way the engine wrote the mod's rows into the compiled DB (checked by diff).
"""
import sqlite3, zlib, xml.etree.ElementTree as ET

GE = '{GameEffects}'


def make_hash(s):
    if s is None:
        return 0
    x = zlib.crc32(s.encode()) ^ 0xFFFFFFFF
    return x - (1 << 32) if x >= 1 << 31 else x


def connect(path):
    con = sqlite3.connect(path)
    con.create_function('Make_Hash', 1, make_hash)
    con.execute('PRAGMA foreign_keys=OFF')
    return con


_coltypes = {}


def coltypes(con, table):
    key = (id(con), table)
    if key not in _coltypes:
        _coltypes[key] = {r[1]: (r[2] or '').upper() for r in con.execute('PRAGMA table_info("%s")' % table)}
    return _coltypes[key]


def conv(con, table, col, val):
    t = coltypes(con, table).get(col, '')
    if t == 'BOOLEAN' and isinstance(val, str) and val.lower() in ('true', 'false'):
        return 1 if val.lower() == 'true' else 0
    return val


def fields(el):
    d = dict(el.attrib)
    for c in el:
        d[c.tag] = (c.text or '')
    return d


def insert(con, table, d, verb='INSERT'):
    cols = list(d)
    con.execute('%s INTO "%s" (%s) VALUES (%s)' % (verb, table, ','.join('"%s"' % c for c in cols),
                                                   ','.join('?' * len(cols))),
                [conv(con, table, c, d[c]) for c in cols])


def load_database_xml(con, root):
    for tbl in root:
        table = tbl.tag
        for op in tbl:
            if op.tag == 'Row':
                insert(con, table, fields(op))
            elif op.tag == 'Replace':
                insert(con, table, fields(op), 'INSERT OR REPLACE')
            elif op.tag == 'Update':
                where = fields(op.find('Where'))
                setv = fields(op.find('Set'))
                con.execute('UPDATE "%s" SET %s WHERE %s' % (
                    table, ','.join('"%s"=?' % c for c in setv), ' AND '.join('"%s"=?' % c for c in where)),
                    [conv(con, table, c, v) for c, v in setv.items()] +
                    [conv(con, table, c, v) for c, v in where.items()])
            elif op.tag == 'Delete':
                where = fields(op)
                con.execute('DELETE FROM "%s" WHERE %s' % (table, ' AND '.join('"%s"=?' % c for c in where)),
                            [conv(con, table, c, v) for c, v in where.items()])
            else:
                raise ValueError('unknown op %s in %s' % (op.tag, table))


def load_reqset(con, set_id, el):
    insert(con, 'RequirementSets', {'RequirementSetId': set_id,
                                    'RequirementSetType': el.get('type', 'REQUIREMENTSET_TEST_ALL')})
    for n, req in enumerate(el.findall(GE + 'Requirement'), 1):
        rid = '%s_%d' % (set_id, n)
        row = {'RequirementId': rid, 'RequirementType': req.get('type')}
        if req.get('inverse'):
            row['Inverse'] = 1 if req.get('inverse').lower() == 'true' else 0
        insert(con, 'Requirements', row)
        insert(con, 'RequirementSetRequirements', {'RequirementId': rid, 'RequirementSetId': set_id})
        for a in req.findall(GE + 'Argument'):
            insert(con, 'RequirementArguments', {'Name': a.get('name'), 'RequirementId': rid, 'Value': a.text})


def load_gameeffects_xml(con, root):
    for m in root.findall(GE + 'Modifier'):
        mid = m.get('id')
        mtype = mid + '_TYPE'
        insert(con, 'Types', {'Type': mtype, 'Kind': 'KIND_MODIFIER'})
        insert(con, 'DynamicModifiers', {'ModifierType': mtype, 'CollectionType': m.get('collection'),
                                         'EffectType': m.get('effect')})
        row = {'ModifierId': mid, 'ModifierType': mtype}
        own = m.find(GE + 'OwnerRequirements')
        sub = m.find(GE + 'SubjectRequirements')
        if own is not None:
            row['OwnerRequirementSetId'] = mid + '_OWNER_REQUIREMENTS'
        if sub is not None:
            row['SubjectRequirementSetId'] = mid + '_SUBJECT_REQUIREMENTS'
        insert(con, 'Modifiers', row)
        if own is not None:
            load_reqset(con, mid + '_OWNER_REQUIREMENTS', own)
        if sub is not None:
            load_reqset(con, mid + '_SUBJECT_REQUIREMENTS', sub)
        for a in m.findall(GE + 'Argument'):
            insert(con, 'ModifierArguments', {'ModifierId': mid, 'Name': a.get('name'), 'Value': a.text})
        for s in m.findall(GE + 'String'):
            insert(con, 'ModifierStrings', {'Context': s.get('context'), 'ModifierId': mid, 'Text': s.text})


def load_file(con, path, text=None):
    if text is None:
        text = open(path, encoding='utf-8').read()
    if path.endswith('.sql'):
        con.executescript(text)
        return
    root = ET.fromstring(text)
    if root.tag == GE + 'GameEffects':
        load_gameeffects_xml(con, root)
    elif root.tag == 'Database':
        load_database_xml(con, root)
    else:
        raise ValueError('unknown root %s in %s' % (root.tag, path))
