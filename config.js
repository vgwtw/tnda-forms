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
     d1   Day1 分組，發表與同儕評價用，一組約 20 人。
     d2   Day2 分組，一組 3–4 人。Day1 結束後才編得出來——
          當天可以整欄留空字串，隔天填完存檔重新上架即可。

   ⚠️ **這裡沒有姓名，是刻意的。** 這個 repo 是公開的，真實姓名放進來
   等於把個資放上網。姓名存在 Google 試算表的 `roster` 分頁，
   由儀表板的「名單」分頁輸入，各頁載入時自動套用。
   姓名還沒載入前，畫面上一律顯示編號。

   組別清單會自動從這張表推出來，不用另外維護。 */

const STUDENTS = [
  { id: '01', d1: 'A 組',    d2: 'T01' },
  { id: '02', d1: 'A 組',    d2: 'T02' },
  { id: '03', d1: 'A 組',    d2: 'T03' },
  { id: '04', d1: 'A 組',    d2: 'T04' },
  { id: '05', d1: 'A 組',    d2: 'T05' },
  { id: '06', d1: 'A 組',    d2: 'T06' },
  { id: '07', d1: 'A 組',    d2: 'T07' },
  { id: '08', d1: 'A 組',    d2: 'T08' },
  { id: '09', d1: 'A 組',    d2: 'T09' },
  { id: '10', d1: 'A 組',    d2: 'T10' },
  { id: '11', d1: 'A 組',    d2: 'T01' },
  { id: '12', d1: 'A 組',    d2: 'T02' },
  { id: '13', d1: 'A 組',    d2: 'T03' },
  { id: '14', d1: 'A 組',    d2: 'T04' },
  { id: '15', d1: 'A 組',    d2: 'T05' },
  { id: '16', d1: 'A 組',    d2: 'T06' },
  { id: '17', d1: 'A 組',    d2: 'T07' },
  { id: '18', d1: 'A 組',    d2: 'T08' },
  { id: '19', d1: 'A 組',    d2: 'T09' },
  { id: '20', d1: 'B 組',    d2: 'T10' },
  { id: '21', d1: 'B 組',    d2: 'T01' },
  { id: '22', d1: 'B 組',    d2: 'T02' },
  { id: '23', d1: 'B 組',    d2: 'T03' },
  { id: '24', d1: 'B 組',    d2: 'T04' },
  { id: '25', d1: 'B 組',    d2: 'T05' },
  { id: '26', d1: 'B 組',    d2: 'T06' },
  { id: '27', d1: 'B 組',    d2: 'T07' },
  { id: '28', d1: 'B 組',    d2: 'T08' },
  { id: '29', d1: 'B 組',    d2: 'T09' },
  { id: '30', d1: 'B 組',    d2: 'T10' },
  { id: '31', d1: 'B 組',    d2: 'T01' },
  { id: '32', d1: 'B 組',    d2: 'T02' },
  { id: '33', d1: 'B 組',    d2: 'T03' },
  { id: '34', d1: 'B 組',    d2: 'T04' },
  { id: '35', d1: 'B 組',    d2: 'T05' },
  { id: '36', d1: 'B 組',    d2: 'T06' },
  { id: '37', d1: 'B 組',    d2: 'T07' },
  { id: '38', d1: 'B 組',    d2: 'T08' },
];

/* 業師同樣用 id，姓名也存在試算表。
   `days` 是他哪幾天出席——兩天的業師不同人，表單頁只會列出當天的那幾位，
   業師才不會在一長串裡面找自己，也不會誤選成別天的人。

   同一個人兩天都來 → **只給他一個 id**，寫 days: [1, 2]。
   不要為了兩天開兩個 id：那樣他在名單裡會出現兩次，改名也要改兩次。 */
const MENTORS = [
  // Day 1：5 位
  { id: 'M1', days: [1] },
  { id: 'M2', days: [1] },
  { id: 'M3', days: [1] },
  { id: 'M4', days: [1] },
  { id: 'M5', days: [1] },
  // Day 2：4 位，兩天不同人
  { id: 'M6', days: [2] },
  { id: 'M7', days: [2] },
  { id: 'M8', days: [2] },
  { id: 'M9', days: [2] },
];


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
     pick    從清單挑一個（options 或 optionsFrom）

   head 欄位加 key:true 代表「這一格決定這份表單是哪一份」——同一位填答者
   用同一組 key 重送時會覆蓋舊資料，不會產生重複。
   subjectFrom 指定沒有逐人區塊時，這一列的對象是誰（欄位 key）。
*/

const SCALE_HINT = '1 幾乎沒有證據　2 不足　3 達入學門檻　4 清楚成立　5 可跨案例轉移';


/* ③-a ─── 抽卡牌組 ───────────────────────────────────────────
   內容對齊「Day2 抽卡牌組」那份印刷檔，代號也一致（A／M／S／I）。
   業師填業師回饋單時從清單挑，不用手打，統計時才對得起來。
   紙本牌組有 A11／A12、S11／S12 兩張自訂卡——真的用到就照樣加一行。 */

const CARDS = {
  /* 上午題：角色原型卡 抽 1 */
  archetype: [
    { v: 'A01', label: '近身壓制　PRESSURE' },
    { v: 'A02', label: '遠程牽制　ZONING' },
    { v: 'A03', label: '投技猜拳　GRAPPLER' },
    { v: 'A04', label: '充能爆發　CHARGE' },
    { v: 'A05', label: '反擊型　COUNTER' },
    { v: 'A06', label: '召喚協同　SUMMONER' },
    { v: 'A07', label: '以速度取勝　SPEED' },
    { v: 'A08', label: '以體型取勝　SIZE' },
    { v: 'A09', label: '讀心博弈　MIND GAME' },
    { v: 'A10', label: '資源管理　RESOURCE' },
  ],
  /* 上午題：招式限制卡 抽 1 */
  moveLimit: [
    { v: 'M01', label: '招式上限 5 招，需涵蓋攻／防／位移' },
    { v: 'M02', label: '必須有一招高風險高報酬' },
    { v: 'M03', label: '只能有一招遠程牽制' },
    { v: 'M04', label: '必須有明確的確反視窗' },
    { v: 'M05', label: '有一招會改變自身狀態' },
    { v: 'M06', label: '不能有投技' },
    { v: 'M07', label: '一個招式性能隨連段數變化' },
    { v: 'M08', label: '必須有假動作／取消機制' },
    { v: 'M09', label: '沒有必殺，只靠普通招的深度' },
    { v: 'M10', label: '一招需消耗共用資源' },
    { v: 'M11', label: '有一招起手很慢但獎勵很大' },
    { v: 'M12', label: '有一招利用位置才成立' },
  ],
  /* 下午題：場景卡 抽 1 */
  stage: [
    { v: 'S01', label: '末日溫室　DOOMSDAY GREENHOUSE' },
    { v: 'S02', label: '霓虹夜市　NEON NIGHT MARKET' },
    { v: 'S03', label: '高速鐵道　BULLET TRAIN' },
    { v: 'S04', label: '廢棄遊樂園　ABANDONED FUNFAIR' },
    { v: 'S05', label: '深海郵局　DEEP-SEA POST OFFICE' },
    { v: 'S06', label: '祭典遶境　TEMPLE PARADE' },
    { v: 'S07', label: '水墨留白　INK & VOID' },
    { v: 'S08', label: '故障數位　GLITCH' },
    { v: 'S09', label: '重金屬舞台　METAL STAGE' },
    { v: 'S10', label: '微觀戰場　MICRO BATTLEFIELD' },
  ],
  /* 下午題：互動限制卡 抽 1 */
  interaction: [
    { v: 'I01', label: '至少一個互動要能直接影響勝負' },
    { v: 'I02', label: '互動不能造成直接傷害' },
    { v: 'I03', label: '必須利用場景高低差' },
    { v: 'I04', label: '一個互動每局只能觸發一次' },
    { v: 'I05', label: '互動需兩名玩家爭奪' },
    { v: 'I06', label: '場景有一個隨時間變化的元素' },
    { v: 'I07', label: '可破壞物，破壞後永久改變戰場' },
    { v: 'I08', label: '互動要能被雙方公平使用' },
    { v: 'I09', label: '有一個互動是風險誘餌' },
    { v: 'I10', label: '場景邊界本身要有機制' },
    { v: 'I11', label: '一個互動改變鏡頭／視野或資訊' },
    { v: 'I12', label: '互動要呼應場景主題敘事' },
  ],
};

const ROUND_AM = '上午 · 角色招式';
const ROUND_PM = '下午 · 場景互動';

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
          { v: 'Y', label: '想一起做', hint: '我願意和他同組' },
          { v: 'N', label: '目前不想', hint: '不是否定他，只是現在沒有訊號' },
        ] },
        { k: 'reasons', type: 'chips', label: '主要理由', max: 2, options: [
          { v: 'A', label: '專業能力',        positive: true  },
          { v: 'B', label: '題目理解',        positive: true  },
          { v: 'C', label: '解題方式',        positive: true  },
          { v: 'D', label: '作品方向',        positive: true  },
          { v: 'E', label: '表達溝通',        positive: true  },
          { v: 'F', label: '感覺能互補',      positive: true  },
          { v: 'G', label: '尚未看見足夠證據', positive: false },
          { v: 'H', label: '方向不相符',      positive: false },
        ] },
        { k: 'highlight', type: 'text', label: '一句亮點（選填）', max: 40,
          placeholder: '他讓我印象最深的一件事…',
          hint: '這句話會匿名整理進他的個人回饋摘要。' },
      ],
    },
  },

  /* ── Day1 · 選一位最想同組的人（學員填，0%，17:00 分組用） ──
     跟同儕評價單是兩回事：同儕評價是對每個人各給一次「想／不想」，
     一個人可以對全部 14 位都說想；這一張是<strong>只能挑一位</strong>，
     用來做互選配對。兩邊都不計入錄取分數。 */
  pair1: {
    day: 1, role: 'student', weightLabel: '分組用',
    eyebrow: 'DAY 1 · TEAM PICK',
    title: '選一位最想同組的人',
    brief:
      '想一整天下來，<strong>你最想跟誰一起解題</strong>？只能選一位。' +
      '兩個人互相選到就直接成一組，沒配到的等一下自行找人。' +
      '這張<strong>不計入錄取分數</strong>，也不會公布誰選了誰。',
    self: {
      fields: [
        { k: 'choice', type: 'pick', label: '我最想同組的是', optionsFrom: 'students-except-me',
          required: true },
        { k: 'why', type: 'text', label: '一句話說為什麼（選填）', max: 40,
          placeholder: '今天看到他什麼讓你想找他…' },
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
          hint: '固定追問：① 最不可被取代的核心？② 最重要的一次選擇、另一選項為何不採用？③ 什麼有證據、什麼仍是假設？' },
        { k: 'flags', type: 'chips', label: '旗標', max: 3, options: [
          { v: 'BORDER', label: '邊界案例（需跨組對分）', positive: false },
          { v: 'ATTRIB', label: '貢獻歸屬待確認',        positive: false },
          { v: 'STAR',   label: '特殊亮點',              positive: true  },
        ] },
      ],
    },
  },

  /* ── Day2 · 個人解題過程觀察表（業師填，30%） ──────────── */
  observe2: {
    day: 2, role: 'mentor', weightLabel: '30%　主要訊號',
    eyebrow: 'DAY 2 · PROCESS OBSERVATION',
    title: '個人解題過程觀察表',
    brief: '看的是<strong>過程</strong>不是成果。各項 1–5',
    head: [
      { k: 'team', type: 'pick', label: '組別', optionsFrom: 'd2-teams', required: true, key: true },
      { k: 'slot', type: 'pick', label: '時段', options: ['上午', '下午'], required: true, key: true },
    ],
    per: {
      scope: 'd2-members',
      requires: 'o_break',
      fields: [
        { k: 'o_break', type: 'scale', label: '拆題與切入',       weight: 20, hint: '如何理解題目與限制、從哪裡下手' },
        { k: 'o_adapt', type: 'scale', label: '限制應變與取捨',   weight: 20, hint: '面對隨機限制卡的變通與理由' },
        { k: 'o_ai',    type: 'scale', label: 'AI 運用與驗證',     weight: 20, hint: '是否理解與驗證產出，而非照抄' },
        { k: 'o_team',  type: 'scale', label: '團隊推進與協作',   weight: 20, hint: '誰主動推進、分工整合、衝突處理' },
        { k: 'o_iter',  type: 'scale', label: '迭代與現場修正',   weight: 20, hint: '收到回饋或卡關時的應變速度' },
        { k: 'behaviour', type: 'memo', label: '具體事例',
          hint: '誰、做了什麼、什麼時候。不要寫形容詞。' },
      ],
    },
  },

  /* ── Day2 · 業師回饋單（業師填，15%，團隊成果） ────────── */
  team2: {
    day: 2, role: 'mentor', weightLabel: '15%',
    eyebrow: 'DAY 2 · TEAM OUTPUT',
    title: '業師回饋單',
    brief: '每組每題一張。團隊成果佔總分 15%，兩題平均後套用到組內每一位成員。',
    subjectFrom: 'team',
    head: [
      { k: 'team',  type: 'pick', label: '組別', optionsFrom: 'd2-teams', required: true, key: true },
      { k: 'round', type: 'pick', label: '題目', required: true, key: true,
        options: [ROUND_AM, ROUND_PM] },
      // showIf：選了上午題才出現角色／招式兩張，下午題才出現場景／互動兩張。
      { k: 'card_archetype', type: 'pick', label: '抽到的角色原型卡',
        optionsFrom: 'cards:archetype', showIf: { round: ROUND_AM } },
      { k: 'card_move', type: 'pick', label: '抽到的招式限制卡',
        optionsFrom: 'cards:moveLimit', showIf: { round: ROUND_AM } },
      { k: 'card_stage', type: 'pick', label: '抽到的場景卡',
        optionsFrom: 'cards:stage', showIf: { round: ROUND_PM } },
      { k: 'card_interaction', type: 'pick', label: '抽到的互動限制卡',
        optionsFrom: 'cards:interaction', showIf: { round: ROUND_PM } },
    ],
    self: {
      fields: [
        { k: 't_creative', type: 'scale', label: '設計創意與獨特性', weight: 30, evidence: true, hint: '能否跳出既有框架' },
        { k: 't_system',   type: 'scale', label: '機制合理與可行',   weight: 30, evidence: true, hint: '攻防、風險報酬、frame、公平性' },
        { k: 't_goal',     type: 'scale', label: '體驗目標清晰',     weight: 25, evidence: true, hint: '想讓玩家感受什麼，並扣回限制' },
        { k: 't_finish',   type: 'scale', label: '完成度與呈現',     weight: 15, evidence: true, hint: '產出完整、表達清楚、時間掌控' },
        { k: 'strength', type: 'memo', label: '亮點' },
        { k: 'gap',      type: 'memo', label: '主要問題' },
        { k: 'next',     type: 'memo', label: '若多兩小時，先改什麼', accent: true },
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
      { from: '10:00', to: '10:25', label: '開場',
        note: '公開評分規準與行程說明',
        you: '打開同儕評價單、照名牌上的編號選好自己。',
        todo: ['請學員掃名牌 QR 進學員入口，照編號選好自己',
               '業師從業師入口選好自己是誰',
               '口頭說明同儕評價：匿名、不公開排行、不計入錄取分數',
               '預告 17:10 要選一位最想同組的人'] },
      { from: '10:25', to: '11:40', label: '答辯 Block 1', key: true,
        note: '每室 5 人 × 15 分（作品答辯 8′／業師追問 5′／換場 2′）',
        you: '每位同學結束後的<strong>換場 2 分鐘</strong>，填他那一列同儕評價。' +
             '可以對很多人都說「想一起做」，沒有上限。',
        todo: ['業師：每人追問完<strong>當下</strong>填評分表，每個分數寫證據',
               '學員：換場那 2 分鐘填該同學那一列'],
        forms: ['mentor1', 'peer1'] },
      { from: '11:40', to: '11:50', label: '休息',
        note: '業師組內對分', todo: ['同組兩位業師快速對一下 3 分門檻'] },
      { from: '11:50', to: '13:05', label: '答辯 Block 2', key: true,
        note: '每室 5 人 × 15 分',
        you: '一樣，換場那 2 分鐘填一列。',
        forms: ['mentor1', 'peer1'] },
      { from: '13:05', to: '14:35', label: '午休',
        note: '自理',
        you: '順手把上午還沒填完的同儕評價補一補。',
        todo: ['主辦開儀表板「完成度」，當場提醒還沒交同儕評價的人',
               '儀表板「錄取總分」→ 看<strong>業師差距</strong>欄，' +
               '<strong>≥ 1.5 的當場拿出來對</strong>'],
        forms: ['mentor1', 'peer1'] },
      { from: '14:35', to: '14:45', label: '準備時間',
        todo: ['確認下午的順序與設備'] },
      { from: '14:45', to: '16:00', label: '答辯 Block 3', key: true,
        note: '每室 5 人 × 15 分',
        you: '一樣，換場那 2 分鐘填一列。',
        forms: ['mentor1', 'peer1'] },
      { from: '16:00', to: '16:10', label: '休息',
        note: '喘口氣', todo: ['提醒還沒送出的同儕評價現在補'],
        forms: ['peer1'] },
      { from: '16:10', to: '17:10', label: '答辯 Block 4', key: true,
        note: '每室 4 人 × 15 分',
        you: '最後一輪。答辯結束前把同儕評價<strong>送出</strong>。',
        forms: ['mentor1', 'peer1'] },
      { from: '17:10', to: '17:30', label: 'Day 2 行前分組',
        note: '配對 Day 2 分組',
        you: '最後填<strong>「選一位最想同組的人」</strong>——只能選一位。' +
             '互相選到就直接成一組，沒配到的現場自行找人。',
        todo: ['請全員填「選一位最想同組的人」，<strong>當場等它收齊</strong>',
               '儀表板 →「D1 同儕訊號」→ 開主辦模式看互選配對，宣布成功配對的組',
               '沒配到的現場自行找人湊滿 3–4 人；編好後填進 config.js 每一列的 d2 欄，存檔重新上架',
               '當面發個人回饋摘要（錄取與否都發）'],
        forms: ['pair1'] },
    ],
  },
  2: {
    date: '2026-08-15',
    title: '3–4 人一組現場解題',
    blocks: [
      { from: '10:00', to: '10:15', label: '暖身、分組、規則公開',
        you: '3–4 人一組。<strong>重新整理</strong>表單頁面才看得到你的新組別。',
        todo: ['確認 config.js 的 d2 欄已填好並重新上架',
               '請學員<strong>重新整理</strong>頁面，才看得到新分組'] },
      { from: '10:15', to: '10:25', label: '抽上午題',
        note: '角色原型卡＋招式限制卡',
        todo: ['記下每組抽到哪兩張卡——業師回饋單裡是下拉選單，照代號選就好'] },
      { from: '10:25', to: '11:55', label: '上午衝刺', key: true,
        note: '「為角色設計招式」；業師巡迴觀察',
        you: 'AI 全程開放，但<strong>用過的 prompt 要交給業師</strong>。' +
             '評分看的是你怎麼拆題、怎麼驗證 AI 的產出，不是最後做出什麼。',
        todo: ['業師：巡迴時就記，結束前填完個人過程觀察表（時段選<strong>上午</strong>）',
               '提醒各組保留 prompt 紀錄，發表時一併提交'],
        forms: ['observe2'] },
      { from: '11:55', to: '12:40', label: '上午發表＋講評',
        note: '10 組，每組約 4 分',
        you: '交招式表＋一頁理由。可選一招做紙上或引擎簡易演示。',
        todo: ['業師：每組講評完填業師回饋單（題目選<strong>上午 · 角色招式</strong>）'],
        forms: ['team2'] },
      { from: '12:40', to: '13:40', label: '午休',
        note: '自理', todo: ['主辦看「完成度」，補齊上午沒填完的觀察表與回饋單'] },
      { from: '13:40', to: '13:50', label: '抽下午題',
        note: '場景卡＋互動限制卡', todo: ['一樣記下每組抽到哪兩張卡'] },
      { from: '13:50', to: '15:20', label: '下午衝刺', key: true,
        note: '「為場景設計互動」；業師巡迴觀察',
        you: '同一組人、新的題目。一樣看過程，prompt 一樣要交。',
        todo: ['業師：個人過程觀察表，時段選<strong>下午</strong>（跟上午是兩張，不要覆蓋）'],
        forms: ['observe2'] },
      { from: '15:20', to: '16:05', label: '下午發表＋講評',
        note: '10 組',
        you: '交互動設計說明圖＋理由。可選簡易原型或分鏡。',
        todo: ['業師：業師回饋單，題目選<strong>下午 · 場景互動</strong>'],
        forms: ['team2'] },
      { from: '16:05', to: '16:30', label: '團隊內互評、業師合議',
        you: '填<strong>自評與團隊內互評單</strong>：先評自己，再評兩位隊友並寫具體事例。不計分。',
        todo: ['學員：填自評與團隊內互評單',
               '主辦：儀表板抓最新資料 →「錄取總分」，確認每個人的「已計入」都是 100%'],
        forms: ['self2'] },
      { from: '16:30', to: '17:00', label: '結果講評與課程預告',
        note: '未來課程預告與說明',
        todo: ['儀表板「匯出」→ 下載總分表 CSV'] },
    ],
  },
};


/* ④ ─── 加權 ──────────────────────────────────────────────────
   錄取總分＝三個來源加權。每個來源先把 1–5 的加權平均換算成 0–100。
   同儕評價與自評互評佔 0%，只當訊號，不進總分。 */

const SCORING = [
  { form: 'mentor1',  weight: 0.55, label: 'D1 作品集答辯' },
  { form: 'observe2', weight: 0.30, label: 'D2 個人過程觀察' },
  { form: 'team2',    weight: 0.15, label: 'D2 團隊成果' },
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
    if (!nm || !PEOPLE[id]) return;
    PEOPLE[id].name = nm;
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

return {
  ENDPOINT, STUDENTS, MENTORS, FORMS, SCORING, SCHEDULE, CARDS,
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
