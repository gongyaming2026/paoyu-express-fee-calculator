/* =============================================================================
 *  泡浴快递费价格表  ——  唯一需要维护的数据文件
 * =============================================================================
 *
 *  数据来源：小红书价格比对表（极兔起步价已加 2 元/单，京东按原价）
 *
 *  计费公式（极兔 / 京东 通用）：
 *      快递费 = 起步价 + MAX(计费重量 − 1KG, 0) × 续重价
 *
 *  两种使用模式（界面顶部切换）：
 *    1) 产品输入模式：填各产品数量 → 计费重量 = Σ(产品净重) + 所选箱子自重
 *    2) 实际重量模式：直接填整包重量（已含箱）→ 计费重量 = 该重量
 *  两模式都「单箱单票」：每单只选一个箱型，箱子另计成本。
 *      总价 = 快递费(取便宜的一家) + 箱子成本
 *
 *  始发地固定为「江苏省」发货。
 *  如需修改：
 *      products  —— 产品净重(weightKg, 单位 KG)
 *      boxes     —— 箱子自重(weightKg) 与 成本(cost, 元)
 *      destinations —— 各省份 jt/jd 的 qi(起步价) / xu(续重价/KG)
 * ===========================================================================*/

window.PRICE_TABLE = {
  origin: "江苏省",
  firstWeightKg: 1,        // 起步价含首 1KG
  currency: "元",

  couriers: {
    jt: { key: "jt", name: "极兔" },
    jd: { key: "jd", name: "京东" },
  },

  // 产品表（weightKg = 单件净重/KG，unit = 输入单位）
  products: [
    { key: "paoyu",    name: "五行泡浴",   unit: "盒", weightKg: 0.32  },
    { key: "qiyuanjiu", name: "百草元气灸", unit: "盒", weightKg: 0.2   },
    { key: "futieOld", name: "老款敷贴",   unit: "贴", weightKg: 0.05  },
    { key: "futieNew", name: "新款敷贴",   unit: "贴", weightKg: 0.015 },
    { key: "bishuyou", name: "鼻舒油",     unit: "瓶", weightKg: 0.05  },
    { key: "piweishu", name: "脾胃舒精油", unit: "瓶", weightKg: 0.3   },
  ],

  // 箱型表（cap = 参考最多装几盒泡浴，weightKg = 箱子自重/KG，cost = 单个成本/元）。按容量从大到小。
  boxes: [
    { name: "零号箱", cap: 36, weightKg: 1.2,  cost: 5   },
    { name: "1号箱", cap: 24, weightKg: 0.8,  cost: 4.5 },
    { name: "2号箱", cap: 15, weightKg: 0.6,  cost: 3.5 },
    { name: "3号箱", cap: 9,  weightKg: 0.4,  cost: 2.5 },
    { name: "4号箱", cap: 6,  weightKg: 0.35, cost: 2   },
    { name: "5号箱", cap: 3,  weightKg: 0.25, cost: 1.5 },
  ],

  // 目的地价格表（始发地：江苏省）
  destinations: [
    { dest: "上海",               jt: { qi: 6,    xu: 0.9, max: 30 },  jd: { qi: 7.2,  xu: 1,   max: 30 } },
    { dest: "浙江省",             jt: { qi: 5.1,  xu: 0.9, max: 30 },  jd: { qi: 7.2,  xu: 1,   max: 30 } },
    { dest: "安徽省",             jt: { qi: 5.2,  xu: 0.9, max: 30 },  jd: { qi: 7.2,  xu: 1,   max: 30 } },
    { dest: "江苏省",             jt: { qi: 5.1,  xu: 0.9, max: 30 },  jd: { qi: 7.2,  xu: 1,   max: 30 } },
    { dest: "湖南省",             jt: { qi: 5.5,  xu: 1.2, max: 30 },  jd: { qi: 9.6,  xu: 2.5, max: 30 } },
    { dest: "河南省",             jt: { qi: 5.5,  xu: 1.2, max: 30 },  jd: { qi: 9.6,  xu: 2.5, max: 30 } },
    { dest: "山东省",             jt: { qi: 5.5,  xu: 1.2, max: 30 },  jd: { qi: 9.6,  xu: 2.5, max: 30 } },
    { dest: "广东省",             jt: { qi: 5.4,  xu: 1.2, max: 30 },  jd: { qi: 10.2, xu: 2.5, max: 30 } },
    { dest: "福建省",             jt: { qi: 5.5,  xu: 1.2, max: 30 },  jd: { qi: 9.6,  xu: 2.5, max: 30 } },
    { dest: "湖北省",             jt: { qi: 5.5,  xu: 1.2, max: 30 },  jd: { qi: 9.6,  xu: 2.5, max: 30 } },
    { dest: "江西省",             jt: { qi: 5.5,  xu: 1.2, max: 30 },  jd: { qi: 9.6,  xu: 2.5, max: 30 } },
    { dest: "天津",               jt: { qi: 5.7,  xu: 1.5, max: 30 },  jd: { qi: 9.6,  xu: 2.5, max: 30 } },
    { dest: "河北省",             jt: { qi: 5.5,  xu: 1.5, max: 30 },  jd: { qi: 9.6,  xu: 2.5, max: 30 } },
    { dest: "北京",               jt: { qi: 6.2,  xu: 1.9, max: 30 },  jd: { qi: 9.6,  xu: 2.5, max: 100 } },
    { dest: "广西壮族自治区",     jt: { qi: 5.7,  xu: 1.6, max: 30 },  jd: { qi: 10.2, xu: 2.5, max: 30 } },
    { dest: "四川省",             jt: { qi: 6,    xu: 1.6, max: 30 },  jd: { qi: 10.2, xu: 2.5, max: 30 } },
    { dest: "重庆",               jt: { qi: 6,    xu: 1.6, max: 30 },  jd: { qi: 9.6,  xu: 2.5, max: 30 } },
    { dest: "黑龙江省",           jt: { qi: 6.4,  xu: 2,   max: 30 },  jd: { qi: 10.2, xu: 2.5, max: 30 } },
    { dest: "吉林省",             jt: { qi: 6.3,  xu: 2,   max: 30 },  jd: { qi: 10.2, xu: 2.5, max: 30 } },
    { dest: "辽宁省",             jt: { qi: 6.3,  xu: 2,   max: 30 },  jd: { qi: 10.2, xu: 2.5, max: 100 } },
    { dest: "贵州省",             jt: { qi: 6.4,  xu: 2,   max: 30 },  jd: { qi: 10.2, xu: 2.5, max: 30 } },
    { dest: "山西省",             jt: { qi: 6.2,  xu: 2,   max: 30 },  jd: { qi: 9.6,  xu: 2.5, max: 30 } },
    { dest: "陕西省",             jt: { qi: 6.2,  xu: 2.5, max: 30 },  jd: { qi: 9.6,  xu: 2.5, max: 30 } },
    { dest: "云南省",             jt: { qi: 6.4,  xu: 3,   max: 30 },  jd: { qi: 10.8, xu: 3,   max: 30 } },
    { dest: "海南省",             jt: { qi: 7.7,  xu: 3.5, max: 30 },  jd: { qi: 10.2, xu: 2.5, max: 30 } },
    { dest: "甘肃省",             jt: { qi: 8.2,  xu: 4,   max: 30 },  jd: { qi: 10.2, xu: 2.5, max: 30 } },
    { dest: "内蒙古自治区",       jt: { qi: 8.2,  xu: 4,   max: 30 },  jd: { qi: 10.2, xu: 2.5, max: 30 } },
    { dest: "宁夏回族自治区",     jt: { qi: 8.2,  xu: 4,   max: 30 },  jd: { qi: 10.2, xu: 2.5, max: 30 } },
    { dest: "青海省",             jt: { qi: 8.2,  xu: 5,   max: 30 },  jd: { qi: 10.2, xu: 2.5, max: 30 } },
    { dest: "新疆维吾尔自治区",   jt: { qi: 13.2, xu: 8,   max: 30 },  jd: { qi: 20,   xu: 4.5, max: 30 } },
    { dest: "西藏自治区",         jt: { qi: 15.2, xu: 10,  max: 30 },  jd: { qi: 24,   xu: 6.5, max: 30 } },
  ],
};
