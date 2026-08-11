#!/usr/bin/env python3
"""把 config.js 的內容雜湊蓋進各頁的 <script src="config.js?v=…">。

為什麼要這個：GitHub Pages 對所有檔案送 `cache-control: max-age=600`，
瀏覽器還會在那之後繼續沿用舊檔。config.js 一改（改人數、改分組、
Day1 結束後填 d2），沒有換網址的話現場裝置可能照樣讀到舊的一份——
Day2 早上學員「重新整理」卻看到昨天的組別，就是這樣來的。

檔名後面掛一段內容雜湊，內容變了網址就變，瀏覽器一定會重抓。
**內容沒變時雜湊也不變**，所以重複執行不會一直改檔案。

    ./蓋版本.py            # 蓋章
    ./蓋版本.py --check    # 只檢查有沒有過期，不寫檔（CI 或 push 前用）

手動改完 config.js（例如 Day1 結束後填 d2 欄）之後要跑這一支再 push。
"""
import hashlib
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CONFIG = HERE / 'config.js'
PATTERN = re.compile(r'(<script src="config\.js)(\?v=[0-9a-f]+)?(">)')


def stamp():
    return hashlib.sha1(CONFIG.read_bytes()).hexdigest()[:8]


def main():
    check = '--check' in sys.argv
    v = stamp()
    stale, done = [], []

    for path in sorted(HERE.glob('*.html')):
        s = path.read_text(encoding='utf-8')
        if not PATTERN.search(s):
            continue
        new = PATTERN.sub(lambda m: '%s?v=%s%s' % (m.group(1), v, m.group(3)), s)
        if new == s:
            continue
        stale.append(path.name)
        if not check:
            path.write_text(new, encoding='utf-8')
            done.append(path.name)

    if check:
        if stale:
            print('這幾頁的 config.js 版本號過期了：' + '、'.join(stale))
            print('跑 ./蓋版本.py 之後再 push。')
            return 1
        print('版本號都是最新的（v=%s）。' % v)
        return 0

    if done:
        print('蓋上 v=%s：%s' % (v, '、'.join(done)))
    else:
        print('版本號已經是 v=%s，沒有要改的。' % v)
    return 0


if __name__ == '__main__':
    sys.exit(main())
