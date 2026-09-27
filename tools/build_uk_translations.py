#!/usr/bin/env python3
"""Build uk_ui_translations/i18n_extra/<module>/uk.po from Odoo's .pot files.

For every module of the Odoo source tree, the entries of <module>.pot that the
official i18n/uk.po leaves empty are looked up in a translation memory (JSON
object {"msgid": "msgstr"} or {"msgctxt\\x04msgid": "msgstr"}) and written, with
their original references and comments, to i18n_extra/<module>/uk.po.

    python3 tools/build_uk_translations.py --odoo /path/to/odoo --memory memory.json \
        [--modules sale,stock,...]

Needs polib (pip install polib).
"""
import argparse
import json
import os

import polib

HERE = os.path.dirname(os.path.abspath(__file__))
TARGET = os.path.join(HERE, '..', 'uk_ui_translations', 'i18n_extra')

HEADER = {
    'Project-Id-Version': 'Odoo Server 19.0',
    'Language': 'uk',
    'MIME-Version': '1.0',
    'Content-Type': 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding': '8bit',
    'Plural-Forms': 'nplurals=4; plural=(n % 1 == 0 && n % 10 == 1 && n % 100 != 11 ? 0 : '
                    'n % 1 == 0 && n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 1 : '
                    'n % 1 == 0 && (n % 10 ==0 || (n % 10 >=5 && n % 10 <=9) || (n % 100 >=11 && n % 100 <=14 )) ? 2: 3);',
}


def module_dirs(odoo):
    for root in (os.path.join(odoo, 'addons'), os.path.join(odoo, 'odoo', 'addons')):
        if os.path.isdir(root):
            for name in sorted(os.listdir(root)):
                path = os.path.join(root, name)
                if os.path.isfile(os.path.join(path, 'i18n', name + '.pot')):
                    yield name, path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--odoo', required=True)
    parser.add_argument('--memory', required=True)
    parser.add_argument('--modules')
    args = parser.parse_args()
    memory = json.load(open(args.memory, encoding='utf-8'))
    wanted = set(args.modules.split(',')) if args.modules else None
    written = 0
    for name, path in module_dirs(args.odoo):
        if wanted and name not in wanted:
            continue
        official = {}
        uk_path = os.path.join(path, 'i18n', 'uk.po')
        if os.path.exists(uk_path):
            official = {(e.msgctxt, e.msgid) for e in polib.pofile(uk_path) if e.translated()}
        out = polib.POFile(wrapwidth=0)
        out.metadata = dict(HEADER)
        for entry in polib.pofile(os.path.join(path, 'i18n', name + '.pot')):
            if (entry.msgctxt, entry.msgid) in official:
                continue
            key = entry.msgid if entry.msgctxt is None else f'{entry.msgctxt}\x04{entry.msgid}'
            value = memory.get(key)
            if not value or entry.msgid_plural:
                continue
            entry.msgstr = value
            out.append(entry)
        target = os.path.join(TARGET, name, 'uk.po')
        if len(out):
            os.makedirs(os.path.dirname(target), exist_ok=True)
            out.save(target)
            written += len(out)
        elif os.path.exists(target):
            os.remove(target)
    print(f'{written} translations written to {os.path.normpath(TARGET)}')


if __name__ == '__main__':
    main()
