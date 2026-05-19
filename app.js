/* 泡浴快递费计算器 —— 装箱优化 + 快递比价 */
(function () {
  "use strict";

  var T = window.PRICE_TABLE;
  var unit = T.currency || "元";
  var BOXES = T.boxes; // 已按容量从大到小

  // 目的地 -> 行
  var byDest = {};
  T.destinations.forEach(function (d) { byDest[d.dest] = d; });
  // 箱型显示顺序索引
  var boxOrder = {};
  BOXES.forEach(function (b, i) { boxOrder[b.name] = i; });

  function r1(n) { return Math.round((n + 1e-9) * 10) / 10; }
  function fmt(n) {
    var v = r1(n);
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }

  // 单个箱子（含 boxes 盒）的快递费：起步价 + MAX(重量 − 1KG,0) × 续重价
  function cartonFee(cp, boxesInCarton) {
    var w = boxesInCarton * T.boxWeightKg;
    return r1(cp.qi + Math.max(0, w - T.firstWeightKg) * cp.xu);
  }

  // 动态规划：对给定快递(cp={qi,xu})，求装 N 盒的最优箱型组合
  // 目标 = 最小化  Σ箱子成本 + Σ每箱快递费
  function bestPlan(cp, N) {
    var maxCap = 0;
    BOXES.forEach(function (b) { if (b.cap > maxCap) maxCap = b.cap; });

    var feeByJ = new Array(maxCap + 1);
    for (var j = 1; j <= maxCap; j++) feeByJ[j] = cartonFee(cp, j);

    var dp = new Float64Array(N + 1);
    for (var i = 1; i <= N; i++) dp[i] = Infinity;
    var chT = new Int32Array(N + 1); // 该步选的箱型
    var chJ = new Int32Array(N + 1); // 该箱装的盒数

    for (var n = 1; n <= N; n++) {
      for (var t = 0; t < BOXES.length; t++) {
        var cap = BOXES[t].cap, cost = BOXES[t].cost;
        var jm = cap < n ? cap : n;
        for (var jj = 1; jj <= jm; jj++) {
          var cand = dp[n - jj] + cost + feeByJ[jj];
          if (cand < dp[n]) { dp[n] = cand; chT[n] = t; chJ[n] = jj; }
        }
      }
    }

    var list = [];
    var k = N;
    while (k > 0) {
      var b = BOXES[chT[k]], jj = chJ[k];
      list.push({
        name: b.name, cap: b.cap, cost: b.cost,
        boxes: jj, weight: r1(jj * T.boxWeightKg), fee: feeByJ[jj],
      });
      k -= jj;
    }
    list.sort(function (a, b) {
      return boxOrder[a.name] - boxOrder[b.name] || b.boxes - a.boxes;
    });

    var boxCost = 0, courierCost = 0;
    list.forEach(function (c) { boxCost += c.cost; courierCost += c.fee; });
    boxCost = r1(boxCost);
    courierCost = r1(courierCost);
    return {
      cartons: list,
      parcels: list.length,
      boxCost: boxCost,
      courierCost: courierCost,
      total: r1(boxCost + courierCost),
    };
  }

  // 聚合相同 (箱型,装盒数) 用于明细展示
  function groupCartons(cartons) {
    var map = {}, order = [];
    cartons.forEach(function (c) {
      var key = c.name + "@" + c.boxes;
      if (!map[key]) { map[key] = { c: c, count: 0 }; order.push(key); }
      map[key].count++;
    });
    return order.map(function (k) { return map[k]; });
  }
  // 方案摘要：箱型 ×数量
  function planSummary(cartons) {
    var map = {}, order = [];
    cartons.forEach(function (c) {
      if (!map[c.name]) { map[c.name] = 0; order.push(c.name); }
      map[c.name]++;
    });
    return order
      .sort(function (a, b) { return boxOrder[a] - boxOrder[b]; })
      .map(function (n) { return n + " ×" + map[n]; })
      .join("、");
  }

  // DOM
  var $ = function (id) { return document.getElementById(id); };
  var els = {
    form: $("calcForm"),
    boxes: $("boxes"),
    province: $("province"),
    quick: $("quickBoxes"),
    error: $("error"),
    result: $("result"),
    recoName: $("recoName"),
    recoHint: $("recoHint"),
    plan: $("plan"),
    compare: $("compare"),
    breakdown: $("breakdown"),
    priceTable: $("priceTable"),
    boxTable: $("boxTable"),
  };

  T.destinations.forEach(function (d) {
    var opt = document.createElement("option");
    opt.value = d.dest; opt.textContent = d.dest;
    els.province.appendChild(opt);
  });

  [3, 6, 9, 15, 24, 36, 72].forEach(function (n) {
    var btn = document.createElement("button");
    btn.type = "button"; btn.textContent = n + "盒";
    btn.addEventListener("click", function () {
      els.boxes.value = n; els.boxes.focus();
    });
    els.quick.appendChild(btn);
  });

  renderPriceTable();
  renderBoxTable();

  els.form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideError();

    var boxes = parseInt(els.boxes.value, 10);
    var province = els.province.value;

    if (!els.boxes.value || isNaN(boxes) || boxes <= 0)
      return showError("请输入有效的泡浴盒数（大于 0 的整数）");
    if (boxes > 100000) return showError("盒数过大，请确认输入是否正确");
    if (!province) return showError("请选择收货省份 / 地区");

    var row = byDest[province];
    if (!row) return showError("该地区暂无价格配置");

    var planJt = bestPlan(row.jt, boxes);
    var planJd = bestPlan(row.jd, boxes);
    showResult(boxes, province, planJt, planJd);
  });

  function showResult(boxes, province, planJt, planJd) {
    var items = [
      { name: T.couriers.jt.name, plan: planJt },
      { name: T.couriers.jd.name, plan: planJd },
    ];
    var cheapest = items[0].plan.total <= items[1].plan.total ? items[0] : items[1];
    var other = cheapest === items[0] ? items[1] : items[0];
    var tie = items[0].plan.total === items[1].plan.total;
    var p = cheapest.plan;

    els.recoName.textContent = tie ? "两家相同" : cheapest.name;
    els.recoHint.textContent = tie
      ? "两家总成本一样"
      : "比 " + other.name + " 省 " + fmt(other.plan.total - p.total) + unit;

    // 方案 + 成本拆分
    els.plan.innerHTML =
      '<div class="plan__total">合计 <b>' + fmt(p.total) + unit + "</b></div>" +
      '<div class="plan__split">箱子成本 ' + fmt(p.boxCost) + unit +
      " ＋ 快递成本 " + fmt(p.courierCost) + unit + "</div>" +
      '<div class="plan__boxes">📦 发货方案：' + planSummary(p.cartons) +
      "　·　共 " + p.parcels + " 个包裹（按 " + cheapest.name + " 寄）</div>";

    // 两家总价对比
    els.compare.innerHTML = items
      .map(function (x) {
        var best = !tie && x === cheapest;
        return (
          '<div class="cmp' + (best ? " cmp--best" : "") + '">' +
          '<span class="cmp__name">' + x.name +
          (best ? ' <span class="cmp__badge">更划算</span>' : "") + "</span>" +
          '<span class="cmp__price">' + fmt(x.plan.total) + unit + "</span>" +
          '<span class="cmp__sub">箱 ' + fmt(x.plan.boxCost) +
          " ＋ 快递 " + fmt(x.plan.courierCost) + "</span>" +
          "</div>"
        );
      })
      .join("");

    // 明细：装箱清单 + 基础信息
    var lines = [];
    groupCartons(p.cartons).forEach(function (g) {
      lines.push([
        g.c.name + " ×" + g.count,
        "每箱" + g.c.boxes + "盒 · " + fmt(g.c.weight) + "kg · 快递 " +
          fmt(g.c.fee) + unit + "/箱",
      ]);
    });
    lines.push(["——", ""]);
    lines.push(["收货省份", province]);
    lines.push(["始发地", T.origin]);
    lines.push(["泡浴数量", boxes + " 盒（单盒 " + fmt(T.boxWeightKg) + "kg）"]);
    lines.push(["计费总重", fmt(boxes * T.boxWeightKg) + " kg"]);

    els.breakdown.innerHTML = lines
      .map(function (kv) {
        if (kv[0] === "——")
          return '<li class="bd-sep"><span></span><span></span></li>';
        return "<li><span>" + kv[0] + "</span><span>" + kv[1] + "</span></li>";
      })
      .join("");

    els.result.hidden = false;
    els.result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function renderPriceTable() {
    var html =
      '<div class="ptr head"><div>目的地</div><div>极兔<br><small>起步/续重</small></div><div>京东<br><small>起步/续重</small></div></div>';
    T.destinations.forEach(function (d) {
      html +=
        '<div class="ptr"><div class="zone">' + d.dest + "</div>" +
        "<div>" + fmt(d.jt.qi) + " / " + fmt(d.jt.xu) + "</div>" +
        "<div>" + fmt(d.jd.qi) + " / " + fmt(d.jd.xu) + "</div></div>";
    });
    els.priceTable.innerHTML = html;
  }

  function renderBoxTable() {
    var html =
      '<div class="ptr head"><div>箱型</div><div>最多装(盒)</div><div>成本(' +
      unit + ")</div></div>";
    BOXES.forEach(function (b) {
      html +=
        '<div class="ptr"><div class="zone">' + b.name + "</div>" +
        "<div>" + b.cap + "</div><div>" + fmt(b.cost) + "</div></div>";
    });
    els.boxTable.innerHTML = html;
  }

  function showError(msg) {
    els.error.textContent = msg;
    els.error.hidden = false;
    els.result.hidden = true;
  }
  function hideError() { els.error.hidden = true; }
})();
