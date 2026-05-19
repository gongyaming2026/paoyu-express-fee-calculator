/* =============================================================================
 *  泡浴快递费价格表  ——  唯一需要维护的数据文件
 * =============================================================================
 *
 *  数据来源：小红书价格比对表（极兔起步价已加 2 元/单，京东按原价）
 *
 *  计费公式（极兔 / 京东 通用）：
 *      费用 = 起步价 + MAX(计费重量 − 1KG, 0) × 续重价
 *
 *      计费重量 = 盒数 × 单盒重量(0.3KG)，不做向上取整。
 *
 *  始发地固定为「江苏省」发货。
 *  如需修改价格：改 destinations 中对应省份的 jt / jd 数值即可。
 *      qi  = 起步价(元)        xu  = 续重价(元/KG)        max = 适用最大重量(KG)
 * ===========================================================================*/

window.PRICE_TABLE = {
  origin: "江苏省",
  boxWeightKg: 0.3,        // 一盒泡浴重量
  firstWeightKg: 1,        // 起步价含首 1KG
  currency: "元",

  couriers: {
    jt: { key: "jt", name: "极兔" },
    jd: { key: "jd", name: "京东" },
  },

  // 箱型表（cap=最多装几盒，cost=单个箱子成本/元）。按容量从大到小。
  boxes: [
    { name: "零号箱", cap: 36, cost: 5 },
    { name: "1号箱", cap: 24, cost: 4.5 },
    { name: "2号箱", cap: 15, cost: 3.5 },
    { name: "3号箱", cap: 9, cost: 2.5 },
    { name: "4号箱", cap: 6, cost: 2 },
    { name: "5号箱", cap: 3, cost: 1.5 },
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
