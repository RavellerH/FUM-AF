#!/usr/bin/env python3
"""Check data/ invariants and print per-month KPIs. Run before committing data changes.

Usage: python3 scripts/audit.py [-v]    (-v lists every warning row)
Exit code 1 when a hard error is found.
"""
import glob
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
VERBOSE = '-v' in sys.argv
FIELDS = {'id', 'date', 'amount', 'currency', 'type', 'category', 'description', 'source_file', 'created_at'}
INCOME_ONLY = {'Family', 'Salary', 'Side Income', 'Reimbursement', 'Refund', 'Freelance', 'Income'}
INCOME_ALLOWED = INCOME_ONLY | {'Third-Party Transfer', 'Investment', 'Cash', 'Loan', 'Uncategorized'}


def load(path):
    return json.loads(re.match(r'^---json\n([\s\S]*?)\n---', Path(path).read_text()).group(1))


def ts_list(name):
    src = (ROOT / 'src/lib/constants.ts').read_text()
    body = re.search(rf'{name}\s*=\s*\[([^\]]*)\]', src).group(1)
    return set(re.findall(r"'([^']+)'", body))


EXCLUDE, INCOME = ts_list('EXCLUDE_FROM_EXPENSE'), ts_list('INCOME_CATEGORIES')
categories = set(load(DATA / 'categories.md'))
rules = load(DATA / 'rules.md')
errors, warnings = [], []


def rule_for(desc):
    return next((r for r in rules if r['pattern'].lower() in desc.lower()), None)


months = {Path(p).stem: load(p) for p in sorted(glob.glob(str(DATA / 'transactions/*.md')))}
ids = Counter(t['id'] for rows in months.values() for t in rows)
print(f"{'month':8} {'rows':>4} {'income':>11} {'expense':>11} {'aid':>10} {'net':>11} {'uncat':>5} {'rule≠':>5}")
for month, rows in months.items():
    conflicts = uncat = 0
    for t in rows:
        where = f"{month} {t.get('date')} {t.get('amount')} {t.get('description', '')[:50]}"
        if set(t) != FIELDS:
            errors.append(f"fields {sorted(set(t) ^ FIELDS)}: {where}")
        if ids[t.get('id')] > 1:
            errors.append(f"duplicate id: {where}")
        if t['category'] not in categories:
            errors.append(f"category '{t['category']}' not in categories.md: {where}")
        if t['type'] not in ('income', 'expense') or not t['amount'] > 0:
            errors.append(f"bad type/amount: {where}")
        if t['type'] == 'income' and t['category'] not in INCOME_ALLOWED:
            errors.append(f"income with expense category '{t['category']}': {where}")
        if t['type'] == 'expense' and t['category'] in INCOME_ONLY:
            errors.append(f"expense with income category '{t['category']}': {where}")
        if not t['date'].startswith(month):
            warnings.append(f"date outside file month (carried over?): {where}")
        if t['category'] == 'Uncategorized':
            uncat += 1
            warnings.append(f"uncategorized: {where}")
        r = rule_for(t.get('description', ''))
        if r and r['category'] != t['category']:
            conflicts += 1
            if VERBOSE:
                warnings.append(f"rule '{r['pattern']}'→{r['category']} but row is {t['category']}: {where}")

    def total(kind, pred):
        return sum(t['amount'] for t in rows if t['type'] == kind and pred(t['category']))

    income = total('income', lambda c: c in INCOME)
    expense = total('expense', lambda c: c not in EXCLUDE)
    aid = total('income', lambda c: c == 'Reimbursement')
    unmatched_aid = max(0, aid - total('expense', lambda c: c == 'Reimbursable'))
    net = income - (expense - unmatched_aid)
    print(f"{month:8} {len(rows):>4} {income:>11,} {expense:>11,} {aid:>10,} {net:>11,} {uncat:>5} {conflicts:>5}")

print("\nnet = income − (expense − aid not already settling Reimbursable); rule≠ = rows overriding a rule (fine if user-confirmed)")
for w in warnings if VERBOSE else [w for w in warnings if not w.startswith('uncategorized')]:
    print('WARN', w)
for e in errors:
    print('ERROR', e)
print(f"\n{len(errors)} error(s), {len(warnings)} warning(s)")
sys.exit(1 if errors else 0)
