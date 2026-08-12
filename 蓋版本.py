#!/usr/bin/env python3
"""把 config.js 與 app.js 的內容雜湊蓋進各頁的 <script src="…?v=…">。

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
# 兩支都要蓋。app.js 沒蓋過版本號害我踩過一次：改了 app.js 的匯出，
# 瀏覽器照樣用舊的，畫面報「某函式不存在」，但原始碼看起來完全正確。
TRACKED = ('config.js', 'app.js')


def pattern(name):
    return re.compile(r'(<script src="%s)(\?v=[0-9a-f]+)?(">)' % re.escape(name))


def stamp(name):
    return hashlib.sha1((HERE / name).read_bytes()).hexdigest()[:8]


def main():
    check = '--check' in sys.argv
    vs = {n: stamp(n) for n in TRACKED}
    stale, done = [], []

    for path in sorted(HERE.glob('*.html')):
        s = new = path.read_text(encoding='utf-8')
        for n in TRACKED:
            pat = pattern(n)
            if pat.search(new):
                new = pat.sub(
                    lambda m, n=n: '%s?v=%s%s' % (m.group(1), vs[n], m.group(3)), new)
        if new == s:
            continue
        stale.append(path.name)
        if not check:
            path.write_text(new, encoding='utf-8')
            done.append(path.name)

    if check:
        if stale:
            print('這幾頁的版本號過期了：' + '、'.join(stale))
            print('跑 ./蓋版本.py 之後再 push。')
            return 1
        print('版本號都是最新的（%s）。'
              % '、'.join('%s=%s' % (n, vs[n]) for n in TRACKED))
        return 0

    tag = '、'.join('%s=%s' % (n, vs[n]) for n in TRACKED)
    if done:
        print('蓋上 %s：%s' % (tag, '、'.join(done)))
    else:
        print('版本號已經是 %s，沒有要改的。' % tag)
    return 0


if __name__ == '__main__':
    sys.exit(main())
