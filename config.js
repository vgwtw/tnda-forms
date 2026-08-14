/* ════════════════════════════════════════════════════════════════
   TNDA 前導甄選 · 電子表單系統 — 設定檔
   這是唯一需要你手動修改的檔案。form.html 與 dashboard.html 都讀這一份。

   要改的東西只有四塊：
     ① ENDPOINT   Google Apps Script 網址
     ② PEOPLE     學員名單（含編號與分組）、業師名單
     ③ FORMS      表單題目（面向、權重、理由代號）—— 通常不用改
     ④ SCORING    加權方式 —— 通常不用改
   ════════════════════════════════════════════════════════════════ */

window.TNDA = (() => {

/* ① ─── 後端 ──────────────────────────────────────────────────
   Google Apps Script 網頁應用程式網址（部署後貼上，形如
   https://script.google.com/macros/s/AKfy..../exec）
   留空字串＝離線模式：只存在瀏覽器，用「匯出檔案」交回。 */
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbz8DHl5GENOFtvxOa8EGhUIIkYAb2mdH4Dxf4AWLnNtmyndlcQGXWa3ArEWtEUk_hDN/exec';


/* ② ─── 人 ────────────────────────────────────────────────────
   一人一列。系統內部一律用 id 串資料，所以**同名同姓不會互相污染**。

     id   編號。就用名牌／桌牌上印的那個號碼，全場唯一、之後不要改。
          （改了等於換一個人，已收的資料會對不上。）
     d1   Day1 分組，發表與同儕評價用。單一教室＝全員同一組。
     d2   Day2 分組，一組 最多 3 人。Day1 結束後才編得出來——
          當天可以整欄留空字串，隔天填完存檔重新上架即可。

   ⚠️ **這裡沒有姓名，是刻意的。** 這個 repo 是公開的，真實姓名放進來
   等於把個資放上網。姓名存在 Google 試算表的 `roster` 分頁，
   等於把個資放上網。姓名存在 Google 試算表的 `roster` 分頁，
   由儀表板的「名單」分頁輸入，各頁載入時自動套用。
   姓名還沒載入前，畫面上一律顯示編號。

   組別清單會自動從這張表推出來，不用另外維護。 */

const STUDENTS = [
  { id: '01', d1: 'A 組',    d2: 'T07' },
  { id: '02', d1: 'A 組',    d2: 'T10' },
  { id: '03', d1: 'A 組',    d2: 'T02' },
  { id: '04', d1: 'A 組',    d2: 'T05' },
  { id: '05', d1: 'A 組',    d2: 'T01' },
  { id: '06', d1: 'A 組',    d2: 'T05' },
  { id: '07', d1: 'A 組',    d2: 'T09' },
  { id: '08', d1: 'A 組',    d2: 'T02' },
  { id: '09', d1: 'A 組',    d2: 'T10' },
  { id: '10', d1: 'A 組',    d2: 'T04' },
  { id: '11', d1: 'A 組',    d2: 'T06' },
  { id: '12', d1: 'A 組',    d2: 'T08' },
  { id: '13', d1: 'A 組',    d2: 'T06' },
  { id: '14', d1: 'A 組',    d2: 'T07' },
  { id: '15', d1: 'A 組',    d2: 'T08' },
  { id: '16', d1: 'A 組',    d2: 'T03' },
  { id: '17', d1: 'A 組',    d2: 'T04' },
  { id: '18', d1: 'A 組',    d2: 'T09' },
  { id: '19', d1: 'A 組',    d2: 'T07' },
  { id: '20', d1: 'A 組',    d2: 'T08' },
  { id: '21', d1: 'A 組',    d2: 'T05' },
  { id: '22', d1: 'A 組',    d2: 'T06' },
  { id: '23', d1: 'A 組',    d2: 'T01' },
  { id: '24', d1: 'A 組',    d2: 'T09' },
  { id: '25', d1: 'A 組',    d2: 'T03' },
  { id: '26', d1: 'A 組',    d2: 'T03' },
  { id: '27', d1: 'A 組',    d2: 'T04' },
  { id: '28', d1: 'A 組',    d2: 'T02' },
  { id: '29', d1: 'A 組',    d2: 'T01' },
];

/* 業師同樣用 id，姓名也存在試算表。
   `days` 是他哪幾天出席——兩天的業師不同人，表單頁只會列出當天的那幾位，
   業師才不會在一長串裡面找自己，也不會誤選成別天的人。

   同一個人兩天都來 → **只給他一個 id**，寫 days: [1, 2]。
   不要為了兩天開兩個 id：那樣他在名單裡會出現兩次，改名也要改兩次。 */
const MENTORS = [
  // Day1 5 位、Day2 4 位——同一批人，兩天都到的排在後面
  { id: 'M1', days: [1] },
  { id: 'M2', days: [1, 2] },
  { id: 'M3', days: [1, 2] },
  { id: 'M4', days: [1, 2] },
  { id: 'M5', days: [1, 2] },
];


/* ②-b ─── Day2 主責分工 ───────────────────────────────────────
   每組固定兩位 Assigned Reviewers（對齊業師行前簡報第 8 頁）。
   Day2 的觀察表與回饋單，組別下拉只列出自己主責的組。
   現場要換組直接改這裡＋蓋版本＋push；沒列到的業師會看到全部組（保險）。 */
const ASSIGN = {
  M2: ['T01', 'T02', 'T03', 'T04', 'T05'],
  M3: ['T01', 'T02', 'T06', 'T07', 'T08'],
  M4: ['T03', 'T04', 'T06', 'T09', 'T10'],
  M5: ['T05', 'T07', 'T08', 'T09', 'T10'],
};


/* ③ ─── 表單 ──────────────────────────────────────────────────
   每份表單分成四段，任何一段都可以省略：
     head  只填一次的抬頭（組別、題目、時段…）
     self  只填一次的主體
     per   逐人重複的區塊 —— scope 決定對象
     foot  只填一次的結尾

   欄位型別：
     scale   1–5 方格；weight 給加權用；evidence:true 會多一個證據輸入格
     choice  二選一大按鈕
     chips   多選標籤；max 限制數量
     text    單行
     memo    多行
     pick    從清單挑一個（options 或 optionsFrom）；excludes: '另一欄的 k'
             ＝兩欄互斥，對方選過的選項會反灰（選兩位不能選同一人）

   head 欄位加 key:true 代表「這一格決定這份表單是哪一份」——同一位填答者
   用同一組 key 重送時會覆蓋舊資料，不會產生重複。
   subjectFrom 指定沒有逐人區塊時，這一列的對象是誰（欄位 key）。
*/

const SCALE_HINT = '1 不及格　2 尚有不足　3 達入學門檻　4 清楚成立　5 異常優秀';


/* ③-a ─── Day2 的題目 ─────────────────────────────────────────
   最終版是**定題**，不抽卡：《新鬥士參戰》——選一名原本不是
   戰鬥角色的角色，重新設計成可加入《任天堂明星大亂鬥》的新鬥士。
   來源角色由各組自選，所以沒有牌組要維護；舊的抽卡牌組
   （角色原型／進階條件／招式限制／場景／互動）要找請翻 git 歷史。

   評鑑改成 Process-based：三個 Decision Gate 是觀察窗口，
   學員只知道 Gate 的時間，不預先知道 Gate 的內容與 Challenge——
   所以 SCHEDULE 裡 Gate 的 label／note／you（學員看得到）只寫
   「階段 Review」，內容細節一律放 todo（只有業師與主辦看得到）。

   來源角色限縮成下面七選一（topic 牌組，對齊紙本題目卡的代號）。
   開題後各組全組決定一個、由一人送出「選題單」；不同組可以選同一題。 */
const CARDS = {
  topic: [
    { v: 'C01', label: 'Polaroid 相機' },
    { v: 'C02', label: 'John Rod（THE JOJOLANDS）' },
    { v: 'C03', label: '佩佩蛙 Pepe the Frog' },
    { v: 'C04', label: '湯馬士小火車' },
    { v: 'C05', label: '藥師貓貓（藥師少女的獨語）' },
    { v: 'C06', label: 'Vault Boy（Fallout）' },
    { v: 'C07', label: 'Faker（英雄聯盟）' },
  ],
};

const FORMS = {

  /* ── Day1 · 同儕評價單（學員填，0%） ───────────────────── */
  peer1: {
    day: 1, role: 'student', weightLabel: '不計分',
    eyebrow: 'DAY 1 · PEER SIGNAL',
    title: '同儕評價單',
    brief:
      '每位同學發表後花 <strong>30–60 秒</strong>填一列。匿名、不公開排行、' +
      '<strong>不計入錄取分數</strong>',
    per: {
      scope: 'd1-peers',
      requires: 'willing',          // 這一格填了才算完成
      fields: [
        { k: 'willing', type: 'choice', label: '一起做？', options: [
          { v: 'Y', label: '想合作', hint: '我願意和他同組' },
          { v: 'N', label: '目前不想', hint: '目前沒有同組意願' },
        ] },
        { k: 'reasons', type: 'chips', label: '主要理由', max: 2, options: [
          { v: 'A', label: '專業能力',        positive: true  },
          { v: 'B', label: '題目理解',        positive: true  },
          { v: 'C', label: '解題方式',        positive: true  },
          { v: 'D', label: '作品方向',        positive: true  },
          { v: 'E', label: '表達溝通',        positive: true  },
          { v: 'F', label: '感覺能互補',      positive: true  },
          { v: 'G', label: '看不出個人能力', positive: false },
          { v: 'H', label: '方向和自己不相符',      positive: false },
        ] },
        { k: 'highlight', type: 'text', label: '一句亮點（選填）', max: 40,
          placeholder: '他讓我印象最深的一件事…',
          hint: '這句話會匿名整理進他的個人回饋摘要。' },
      ],
    },
  },

  /* ── Day1 · 選兩位最想同組的人（學員填，0%，17:00 分組用） ──
     跟同儕評價單是兩回事：同儕評價是對每個人各給一次「想／不想」，
     一個人可以對全部 14 位都說想；這一張是<strong>只能挑一位</strong>，
     用來做互選配對。兩邊都不計入錄取分數。 */
  pair1: {
    day: 1, role: 'student', weightLabel: '分組用',
    eyebrow: 'DAY 1 · TEAM PICK',
    title: '選兩位最想同組的人',
    brief:
      '想一整天下來，<strong>你最想跟誰一起合作</strong>？選兩位，不分順序。' +
      '這張<strong>不計入錄取分數</strong>。',
    self: {
      fields: [
        { k: 'choice', type: 'pick', label: '第一位', optionsFrom: 'students-except-me',
          required: true, excludes: 'choice2' },
        { k: 'choice2', type: 'pick', label: '第二位', optionsFrom: 'students-except-me',
          required: true, excludes: 'choice',
          hint: '跟第一位不能選同一個人。' },
        { k: 'why', type: 'text', label: '一句話說為什麼（選填）', max: 40,
          placeholder: '今天看到他們什麼讓你想找…' },
      ],
    },
  },

  /* ── Day1 · 作品集答辯評分表（業師填，55%） ───────────── */
  mentor1: {
    day: 1, role: 'mentor', weightLabel: '55%',
    eyebrow: 'DAY 1 · MENTOR SCORESHEET',
    title: '作品集答辯評分表',
    brief:
      '每位候選人一張。' + SCALE_HINT,
    subjectFrom: 'candidate',
    head: [
      { k: 'candidate', type: 'pick', label: '候選人', optionsFrom: 'all-students',
        required: true, key: true },
    ],
    self: {
      fields: [
        { k: 'd_craft',  type: 'scale', label: '專業基礎與完成度', weight: 25, evidence: true },
        { k: 'd_think',  type: 'scale', label: '設計思考與取捨',   weight: 25, evidence: true },
        { k: 'd_fit',    type: 'scale', label: '職能適配與潛力',   weight: 15, evidence: true },
        { k: 'd_speak',  type: 'scale', label: '表達與答辯',       weight: 15, evidence: true },
        { k: 'd_self',   type: 'scale', label: '自我認知與成長性', weight: 10, evidence: true },
        { k: 'd_drive',  type: 'scale', label: '熱情與投入',       weight: 10, evidence: true },
        { k: 'notes', type: 'memo', label: '追問紀錄',
          hint: '固定追問：① 最不可被取代的核心？② 最重要的一次選擇、另一選項為何不採用？' },
        { k: 'flags', type: 'chips', label: '旗標', max: 3, options: [
          { v: 'BORDER', label: '及格邊緣需討論', positive: false },
          { v: 'ATTRIB', label: '貢獻歸屬待確認',        positive: false },
          { v: 'STAR',   label: '特殊亮點',              positive: true  },
        ] },
      ],
    },
  },

  /* ── Day2 · 選題單（學員填，每組一張，開題後送出） ────────
     以組為單位選定來源角色。全組討論決定後**由一人代表送出**；
     送出後不能改（換題請找工作人員刪列）。業師回饋單用同一副
     牌組代號，統計時直接對得起來。 */
  topic2: {
    day: 2, role: 'student', weightLabel: '選題',
    eyebrow: 'DAY 2 · TOPIC PICK',
    title: '選題單',
    brief:
      '全組討論決定<strong>一個來源角色</strong>，由一人代表送出。' +
      '送出後不能改；不同組可以選同一題。',
    subjectFrom: 'team',
    head: [
      // 只列出填的人自己那一組——幫別組選題是這裡最要擋的錯。
      { k: 'team', type: 'pick', label: '組別（只會出現你自己那組）', optionsFrom: 'my-d2-team',
        required: true, key: true },
    ],
    self: {
      fields: [
        { k: 'character', type: 'pick', label: '你們的來源角色', optionsFrom: 'cards:topic',
          required: true, hint: '七選一。選他不是因為好做，是因為你們拆得出他的本質。' },
      ],
    },
  },

  /* ── Day2 · 個人解題過程觀察表 ——【退役】────────────────
     業師 Day2 改用紙本觀察表（每組一張 A4，製作觀察表.py 產生），
     電子版不再收件。定義保留是為了讓舊資料照樣讀得出來。 */
  observe2: {
    retired: true,
    day: 2, role: 'mentor', weightLabel: '30%　主要訊號',
    eyebrow: 'DAY 2 · PROCESS OBSERVATION',
    title: '個人解題過程觀察表',
    brief: '主責的每一組，GATE 1、GATE 3 各交一張，各項 1–5。',
    head: [
      { k: 'team', type: 'pick', label: '組別（你主責的）', optionsFrom: 'assigned-teams',
        required: true, key: true },
      { k: 'slot', type: 'pick', label: 'Gate', options: ['GATE 1', 'GATE 3'],
        required: true, key: true },
    ],
    per: {
      scope: 'd2-members',
      requires: 'o_read',
      fields: [
        { k: 'o_read',   type: 'scale', label: '讀題與理解　READ',        weight: 15 },
        { k: 'o_decon',  type: 'scale', label: '解構與研究　DECONSTRUCT', weight: 15 },
        { k: 'o_diverge', type: 'scale', label: '發散與開放　DIVERGE',    weight: 15 },
        { k: 'o_decide', type: 'scale', label: '選擇與判斷　DECIDE',      weight: 20 },
        { k: 'o_collab', type: 'scale', label: '協作與推進　COLLABORATE', weight: 20 },
        { k: 'o_adapt',  type: 'scale', label: '修正與應變　ADAPT',       weight: 15 },
        { k: 'behaviour', type: 'memo', label: '具體事例', hint: '誰、做了什麼、什麼時候' },
      ],
    },
  },

  /* ── Day2 · 業師回饋單（業師填，15%，團隊成果） ──────────
     一組一張，Final Proposal 講評時填。Final Outcome 只是 Evidence
     的一部分——形成答案的過程走 observe2，這張只評最終提案本身。
     面向對齊題目：SOURCE CHARACTER → ESSENCE → PLAYER ACTION →
     FIGHTING LANGUAGE。 */
  team2: {
    retired: true,
    day: 2, role: 'mentor', weightLabel: '15%',
    eyebrow: 'DAY 2 · TEAM OUTPUT',
    title: '業師回饋單',
    brief: '每組一張，Final Proposal 講評時填。',
    subjectFrom: 'team',
    head: [
      { k: 'team', type: 'pick', label: '組別（你主責的）', optionsFrom: 'assigned-teams',
        required: true, key: true },
      { k: 'character', type: 'pick', label: '來源角色', optionsFrom: 'cards:topic',
        hint: '跟選題單不一樣就照實際做的選。' },
    ],
    self: {
      fields: [
        { k: 't_essence',  type: 'scale', label: '角色本質的掌握',   weight: 30, evidence: true },
        { k: 't_action',   type: 'scale', label: '概念轉成玩家操作', weight: 30, evidence: true },
        { k: 't_tradeoff', type: 'scale', label: '取捨與決策依據',   weight: 25, evidence: true },
        { k: 't_finish',   type: 'scale', label: '提案完成度與呈現', weight: 15, evidence: true },
        { k: 'strength', type: 'memo', label: '亮點' },
        { k: 'gap',      type: 'memo', label: '主要問題' },
        { k: 'next',     type: 'memo', label: '若多兩小時，先改什麼', accent: true },
      ],
    },
  },

  /* ── Day2 · 想玩投票（全場都填，0%） ─────────────────────
     Final Proposal 每組提報完，憑直覺按一票：這個鬥士做出來你想不想玩。
     業師與學員都投；學員不投自己那組。不計分，當眾公布與否由主辦決定。 */
  vote2: {
    day: 2, role: 'all', weightLabel: '不計分',
    eyebrow: 'DAY 2 · AUDIENCE VOTE',
    title: '想玩投票',
    brief:
      '每一組提報完按一票：<strong>這個鬥士做出來，你想不想玩？</strong>' +
      '憑直覺，<strong>不計入錄取分數</strong>。',
    per: {
      scope: 'vote-teams',
      requires: 'play',
      fields: [
        { k: 'play', type: 'choice', label: '想玩嗎？', options: [
          { v: 'Y', label: '想玩', hint: '做出來我會想玩玩看' },
          { v: 'N', label: '還不想', hint: '目前還沒被說服' },
        ] },
        { k: 'why', type: 'text', label: '一句話（選填）', max: 40,
          placeholder: '最想玩／最卡的一點是…' },
      ],
    },
  },

  /* ── Day2 · 自評與團隊內互評單（學員填，0%） ───────────── */
  self2: {
    day: 2, role: 'student', weightLabel: '不計分',
    eyebrow: 'DAY 2 · SELF & IN-TEAM PEER REVIEW',
    title: '自評與團隊內互評單',
    brief:
      '先<strong>自評</strong>，再對每位隊友評<strong>貢獻度</strong>與<strong>合作度</strong>，' +
      '並寫一則<strong>具體事例</strong>。' +
      '不直接計入錄取分數，供業師合議與旗標參考。',
    self: {
      label: '自評',
      fields: [
        { k: 's_contrib', type: 'scale', label: '我的貢獻度' },
        { k: 's_collab',  type: 'scale', label: '我的合作度' },
        { k: 'my_part',   type: 'memo',  label: '我實際負責的部分' },
        { k: 'do_diff',   type: 'memo',  label: '重來一次我會改什麼' },
      ],
    },
    per: {
      scope: 'd2-teammates',
      label: '隊友互評',
      requires: 'p_contrib',
      fields: [
        { k: 'p_contrib', type: 'scale', label: '貢獻度' },
        { k: 'p_collab',  type: 'scale', label: '合作度' },
        { k: 'p_evidence', type: 'memo', label: '具體事例', hint: '他做了什麼，讓你這樣評。' },
      ],
    },
    foot: {
      fields: [
        { k: 'steal', type: 'memo', label: '看完別組發表，最想偷學的一個設計是什麼？', accent: true },
      ],
    },
  },
};


/* ③-b ─── 今天的流程 ─────────────────────────────────────────
   **當日行程表就是入口。** 現場的 QR Code 分四個：
     學員 Day1  today.html?day=1      學員 Day2  today.html?day=2
     業師 Day1  run.html?day=1        業師 Day2  run.html?day=2
   掃進去看到當天的流程，要填的表單從那一段直接點進去。

   兩個頁面讀這一份，看到的東西不一樣：
     run.html    業師與主辦用。看得到 `todo`（那個時段要做的事）、
                 `forms` 裡的全部表單（附已收幾份）與 `links`（工具頁）。
     today.html  學員用。只看得到 from / to / label / note / `you`，
                 以及 `forms` 裡<strong>角色是學員</strong>的那幾份表單連結。
                 **`todo` 與 `links` 不會出現在學員那一頁**，所以裡面
                 可以放評分規準、催件、儀表板操作這類內部資訊。

   `forms` 列出那個時段相關的表單代號，兩邊各自按角色過濾，不用寫兩份。
   `you` 是寫給學員看的一句話，只在有必要時才寫。
   現場拖到了就直接改 from / to。
   date 用來標示哪一天是今天，格式 YYYY-MM-DD。 */

const SCHEDULE = {
  1: {
    date: '2026-08-14',
    title: '個人作品集答辯',
    blocks: [
      { from: '09:40', to: '10:00', label: '開場',
        note: '公開評分規準與五級定義',
        you: '掃名牌 QR、照編號選好自己',
        todo: ['選好自己是誰'] },
      { from: '10:00', to: '12:10', label: '上午場', key: true,
        note: '每室 10 人 × 13 分（答辯 7′／追問 5′／換場 1′）',
        you: '換場 1 分鐘填同儕評價（想一起做可勾多位）',
        todo: ['換場 1 分鐘內填完評分表並送出'],
        forms: ['mentor1', 'peer1'] },
      { from: '12:10', to: '13:10', label: '午休',
        note: '自理',
        you: '補填同儕評價',
        todo: ['領業師差距 ≥ 1.5 的名單'],
        forms: ['mentor1', 'peer1'] },
      { from: '13:10', to: '14:54', label: '下午場一', key: true,
        note: '每室 8 人 × 13 分',
        you: '換場 1 分鐘填同儕評價',
        todo: ['換場 1 分鐘內填完評分表並送出'],
        forms: ['mentor1', 'peer1'] },
      { from: '14:54', to: '15:05', label: '休息',
        note: '業師組內對分',
        todo: ['同組對分 3 分門檻'] },
      { from: '15:05', to: '17:28', label: '下午場二', key: true,
        note: '每室 11 人 × 13 分',
        you: '送出同儕評價',
        todo: ['確認你負責的每一位都已送出'],
        forms: ['mentor1', 'peer1'] },
      { from: '17:28', to: '17:48', label: 'Day 2 行前分組',
        note: '配對 Day 2 分組',
        you: '填「選兩位最想同組的人」——選兩位',
        todo: ['當面發個人回饋摘要'],
        forms: ['pair1'] },
    ],
  },
  2: {
    date: '2026-08-15',
    title: '現場合作設計評鑑',
    /* Process-based：三個 Gate 是觀察窗口。學員只知道 Gate 的時間，
       不預先知道內容——Gate 的細節只能寫在 todo，不要寫進 label／note／you。
       每組固定兩位 Assigned Reviewers，Gate 01 與 Gate 03 由不同人主問；
       分工表在《Reviewer Brief》，開場前發給四位評審。 */
    blocks: [
      { from: '10:00', to: '10:20', label: 'Briefing｜開場說明',
        note: '公布題目、規則與評鑑原則；三個 Gate 的時間公開，內容到時候才知道',
        you: '重新整理頁面看你的新組別；掃名牌 QR 認好自己',
        todo: ['公布題目與題目卡', '只公開 Gate 時間，不預告內容',
               '盯選題單：每組開工前送出'],
        forms: ['topic2'] },

      { from: '10:20', to: '11:30', label: 'Open Explore｜自由探索', key: true,
        note: '怎麼讀題、調查、討論、分工，由團隊自己決定',
        you: '全組選定題目、送出選題單，然後開始。怎麼查、從哪裡開始，都是你們的判斷',
        todo: ['第一輪巡組'],
        forms: ['topic2'] },

      { from: '11:30', to: '12:00', label: 'GATE 01｜階段 Review', key: true,
        note: '各組輪流接受第一次階段 Review',
        you: '輪到你們時，說明目前的理解與依據',
        todo: ['主問照分工：真正要解決什麼？Evidence 是什麼？', '紙本觀察表記 GATE 1'] },

      { from: '12:00', to: '13:00', label: '午休',
        note: '自理',
        you: '下午從方案發展繼續',
        todo: ['交換上午觀察、補完 GATE 1 紙本'] },

      { from: '13:00', to: '14:00', label: 'Open Develop｜方案發展', key: true,
        note: '延續研究、修正方向並發展設計',
        you: '把上午的理解變成方案；方向可以修，理由要說得出來',
        todo: ['第二輪巡組'] },

      { from: '14:00', to: '14:10', label: 'GATE 02｜全體公告',
        note: '全體暫停，公布一個新的 Requirement',
        you: '聽現場宣布',
        todo: ['公布：最終設計前要留下至少三個實質不同的方向', '公布後不解釋'] },

      { from: '14:10', to: '15:00', label: 'Decide & Design｜選擇與深化', key: true,
        note: '比較方向、做出選擇、把設計做深',
        you: '為什麼選 A 不選 B？把理由講得出來，再往下做',
        todo: ['巡組'] },

      { from: '15:00', to: '15:30', label: 'GATE 03｜階段 Review', key: true,
        note: '各組接受第二次階段 Review',
        you: '輪到你們時，說明目前的方案與依據',
        todo: ['換另一位主問，Challenge 核心假設', '紙本觀察表記 GATE 3'] },

      { from: '15:30', to: '16:00', label: 'Finalize｜整理與收斂',
        note: '整理手上的材料，準備最終提案',
        you: '研究、草圖、比較過的方向都是你們的 Evidence，不用藏',
        todo: ['停止巡組，交換 Evidence、補完 GATE 3 紙本'] },

      { from: '16:00', to: '17:00', label: 'Final Proposal｜最終提案', key: true,
        note: '呈現形式現場宣布',
        you: '每組提報完投「想玩投票」；輪空時填自評與團隊內互評單',
        todo: ['每組提報完，全場投想玩投票', '證據不足的學生優先指定發言'],
        links: [{ href: 'votes.html', label: '揭曉舞台（投影）' }],
        forms: ['vote2', 'self2'] },
    ],
  },
};


/* ④ ─── 加權 ──────────────────────────────────────────────────
   錄取總分＝三個來源加權。每個來源先把 1–5 的加權平均換算成 0–100。
   同儕評價與自評互評佔 0%，只當訊號，不進總分。 */

/* Day2 改紙本觀察後，線上計分只剩 D1 答辯；Day2 的評鑑由業師
   紙本與合議會議處理，不在系統內加權。 */
const SCORING = [
  { form: 'mentor1', weight: 1.0, label: 'D1 作品集答辯' },
];


/* ─── 以下不用改：由上面的名單推導 ────────────────────────── */

const PEOPLE = {};
STUDENTS.forEach((s) => { PEOPLE[s.id] = Object.assign({ role: 'student', name: '' }, s); });
MENTORS.forEach((m) => { PEOPLE[m.id] = Object.assign({ role: 'mentor', name: '' }, m); });

/** 同名同姓時，顯示名稱後面補上編號，讓人挑得出自己是哪一個。 */
const DUP = {};

function recountDup() {
  Object.keys(DUP).forEach((k) => delete DUP[k]);
  Object.values(PEOPLE).forEach((p) => {
    if (p.name) DUP[p.name] = (DUP[p.name] || 0) + 1;
  });
}

/** 儀表板改過的姓名。工作人員在儀表板編輯後存到後端，
 *  各頁載入時套用在 config 的名單上——**編號不會被改**，
 *  所以已收的資料照樣對得起來，只是顯示的名字換了。 */
function applyNames(map) {
  if (!map) return;
  Object.keys(map).forEach((id) => {
    const nm = String(map[id] || '').trim();
    if (!nm) return;
    // 試算表會把「01」存成數字 1，讀回來就少了前導零——
    // 對不上就補零再對一次，否則 01–09 在別台裝置上永遠沒有名字。
    let key = String(id);
    if (!PEOPLE[key] && /^\d+$/.test(key) && key.length < 2) key = '0' + key;
    if (!PEOPLE[key]) return;
    PEOPLE[key].name = nm;
  });
  recountDup();
}

const person = (id) => PEOPLE[id] || null;
const hasName = (id) => !!(PEOPLE[id] && PEOPLE[id].name);
/** 姓名還沒從試算表載入時一律顯示編號——寧可顯示號碼，也不要空白。 */
const nameOf = (id) => (PEOPLE[id] && PEOPLE[id].name) ? PEOPLE[id].name : id;
const labelOf = (id) => {
  const p = PEOPLE[id];
  if (!p || !p.name) return id;
  return DUP[p.name] > 1 ? p.name + '（' + p.id + '）' : p.name;
};
/** 全部人都有名字了嗎。沒有的話各頁會提示「名單還沒載入」。 */
const namesReady = () => Object.values(PEOPLE).every((p) => !!p.name);
const missingNames = () => Object.values(PEOPLE).filter((p) => !p.name).map((p) => p.id);

const uniq = (xs) => xs.filter((x, i) => x && xs.indexOf(x) === i);
const d1Groups = () => uniq(STUDENTS.map((s) => s.d1));
const d2Teams  = () => uniq(STUDENTS.map((s) => s.d2)).sort();
const studentsIn = (g) => STUDENTS.filter((s) => s.d1 === g).map((s) => s.id);
const teamMembers = (t) => STUDENTS.filter((s) => s.d2 === t).map((s) => s.id);

/* 資料裡若出現名單上沒有的 id（例如名單改過），照實顯示 id，不要靜靜吞掉。 */
const isKnown = (id) => !!PEOPLE[id];

/** 名單是手打的，所以開機時檢查一遍。編號重複最危險——兩個人會被當成
 *  同一個人，而且錯得很安靜，所以寧可在畫面上擋著也不要讓它跑下去。 */
function problems() {
  const out = [], seen = {};
  STUDENTS.concat(MENTORS).forEach((p, i) => {
    if (!p.id && p.id !== 0) out.push('第 ' + (i + 1) + ' 列沒有編號');
    else if (seen[p.id]) out.push('編號 ' + p.id + ' 重複了');
    else seen[p.id] = true;
  });
  STUDENTS.forEach((s) => { if (!s.d1) out.push('編號 ' + s.id + ' 沒有 Day1 組別'); });
  // 姓名不在這裡檢查——它存在試算表，由 namesReady() 另外提示。
  // d2 允許留空：Day1 當天還編不出來，那是正常狀態。
  return out;
}

/** 業師主責的組。沒設定的（或學員誤入）回傳全部組，寧可多列不要擋死。 */
const assignedTeams = (id) => (ASSIGN[id] && ASSIGN[id].length) ? ASSIGN[id].slice() : d2Teams();

return {
  ENDPOINT, STUDENTS, MENTORS, FORMS, SCORING, SCHEDULE, CARDS, ASSIGN, assignedTeams,
  person, nameOf, labelOf, isKnown, problems, applyNames,
  hasName, namesReady, missingNames,
  d1Groups, d2Teams, studentsIn, teamMembers,
  allStudentIds: () => STUDENTS.map((s) => s.id),
  allMentorIds: () => MENTORS.map((m) => m.id),
  /** 某一天出席的業師。沒寫 days 的視為兩天都來，舊設定才不會突然變空。 */
  mentorIdsForDay: (day) => MENTORS
    .filter((m) => !m.days || m.days.map(String).includes(String(day)))
    .map((m) => m.id),
  daysOfMentor: (id) => {
    const m = MENTORS.find((x) => x.id === id);
    return m && m.days ? m.days.slice() : [1, 2];
  },
  d1GroupOf: (id) => (PEOPLE[id] ? PEOPLE[id].d1 : ''),
  d2TeamOf:  (id) => (PEOPLE[id] ? PEOPLE[id].d2 : ''),
  event: 'TNDA 前導甄選',
};
})();
