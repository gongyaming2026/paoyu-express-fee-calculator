/* 泡浴快递费计算器 —— 产品输入 / 实际重量 双模式 · 单箱单票 · 极兔/京东比价 */
(function () {
  "use strict";

  var T = window.PRICE_TABLE;

  // 版本一致性检查：若缓存了旧的 prices.js（缺 products/boxes），明确提示而非静默崩溃
  if (!T || !Array.isArray(T.products) || !Array.isArray(T.boxes)) {
    var box = document.getElementById("error");
    if (box) {
      box.textContent = "页面文件版本不一致，请按 Ctrl/⌘ + Shift + R 强制刷新页面。";
      box.hidden = false;
    }
    return;
  }

  var unit = T.currency || "元";

  // 目的地 -> 行
  var byDest = {};
  T.destinations.forEach(function (d) { byDest[d.dest] = d; });
  // 箱型 name -> 对象
  var byBox = {};
  T.boxes.forEach(function (b) { byBox[b.name] = b; });

  function r1(n) { return Math.round((n + 1e-9) * 10) / 10; }
  function fmt(n) {
    var v = r1(n);
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }
  // 重量（KG）展示：保留到克，去掉多余的 0
  function fmtW(kg) {
    return String(Math.round((kg + 1e-9) * 1000) / 1000);
  }
  // 克展示（整数克）
  function grams(kg) { return Math.round(kg * 1000); }

  // 快递费：起步价 + MAX(计费重量 − 首重, 0) × 续重价
  function courierFee(cp, billableKg) {
    return r1(cp.qi + Math.max(0, billableKg - T.firstWeightKg) * cp.xu);
  }

  // DOM
  var $ = function (id) { return document.getElementById(id); };
  var els = {
    form: $("calcForm"),
    modeTabs: document.querySelectorAll(".mode-tab"),
    panelProduct: $("panelProduct"),
    panelWeight: $("panelWeight"),
    products: $("products"),
    totalWeight: $("totalWeight"),
    boxChoices: $("boxChoices"),
    province: $("province"),
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

  var mode = "product"; // "product" | "weight"

  // ---- 渲染输入控件 ----
  T.products.forEach(function (p) {
    var row = document.createElement("div");
    row.className = "prod-row";
    row.innerHTML =
      '<span class="prod-row__label">' +
      '<span class="prod-row__name">' + p.name + "</span>" +
      '<span class="prod-row__w">' + grams(p.weightKg) + "g/" + p.unit + "</span></span>" +
      '<input class="prod-row__qty" type="number" inputmode="numeric" min="0" step="1" placeholder="0" data-key="' +
        p.key + '">' +
      '<span class="prod-row__unit">' + p.unit + "</span>";
    els.products.appendChild(row);
  });

  T.boxes.forEach(function (b) {
    var label = document.createElement("label");
    label.className = "box-chip";
    label.innerHTML =
      '<input type="radio" name="box" value="' + b.name + '">' +
      '<span class="box-chip__body">' +
      '<span class="box-chip__name">' + b.name + "</span>" +
      '<span class="box-chip__meta">约' + b.cap + "盒 · " + fmt(b.cost) + unit + "</span>" +
      "</span>";
    els.boxChoices.appendChild(label);
  });

  T.destinations.forEach(function (d) {
    var opt = document.createElement("option");
    opt.value = d.dest; opt.textContent = d.dest;
    els.province.appendChild(opt);
  });

  renderPriceTable();
  renderBoxTable();

  // ---- 模式切换 ----
  els.modeTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      mode = tab.getAttribute("data-mode");
      els.modeTabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      els.panelProduct.hidden = mode !== "product";
      els.panelWeight.hidden = mode !== "weight";
      hideError();
    });
  });

  // ---- 计算 ----
  els.form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideError();

    var checked = els.boxChoices.querySelector('input[name="box"]:checked');
    if (!checked) return showError("请选择一个箱型");
    var box = byBox[checked.value];

    var province = els.province.value;
    if (!province) return showError("请选择收货省份 / 地区");
    var row = byDest[province];
    if (!row) return showError("该地区暂无价格配置");

    var info; // 计费重量 + 明细
    if (mode === "product") {
      info = readProducts(box);
      if (info.error) return showError(info.error);
    } else {
      info = readWeight(box);
      if (info.error) return showError(info.error);
    }

    var feeJt = courierFee(row.jt, info.billable);
    var feeJd = courierFee(row.jd, info.billable);
    showResult(province, box, info, feeJt, feeJd);
  });

  // 产品模式：计费重量 = Σ产品净重 + 箱子自重
  function readProducts(box) {
    var qtyInputs = els.products.querySelectorAll(".prod-row__qty");
    var lines = [], goodsKg = 0, anyPositive = false;
    for (var i = 0; i < qtyInputs.length; i++) {
      var raw = qtyInputs[i].value.trim();
      if (raw === "") continue;
      var n = parseInt(raw, 10);
      if (isNaN(n) || n < 0) return { error: "产品数量请填 0 或正整数" };
      if (n === 0) continue;
      anyPositive = true;
      var p = findProduct(qtyInputs[i].getAttribute("data-key"));
      var w = n * p.weightKg;
      goodsKg += w;
      lines.push({ name: p.name, qty: n, unit: p.unit, kg: w });
    }
    if (!anyPositive) return { error: "请至少填写一种产品的数量" };
    var billable = goodsKg + box.weightKg;
    if (billable > 30) return { error: "计费重量已超 30kg，请拆分发货" };
    return { mode: "product", lines: lines, goodsKg: goodsKg, billable: billable };
  }

  // 实际重量模式：直接用整包重量（已含箱），箱子只计成本
  function readWeight(box) {
    var raw = els.totalWeight.value.trim();
    if (raw === "") return { error: "请输入整体重量（kg）" };
    var w = parseFloat(raw);
    if (isNaN(w) || w <= 0) return { error: "请输入有效的整体重量（大于 0）" };
    if (w > 30) return { error: "整体重量已超 30kg，请拆分发货" };
    return { mode: "weight", billable: w };
  }

  function findProduct(key) {
    for (var i = 0; i < T.products.length; i++)
      if (T.products[i].key === key) return T.products[i];
    return null;
  }

  function showResult(province, box, info, feeJt, feeJd) {
    var items = [
      { name: T.couriers.jt.name, fee: feeJt, total: r1(feeJt + box.cost) },
      { name: T.couriers.jd.name, fee: feeJd, total: r1(feeJd + box.cost) },
    ];
    var cheapest = items[0].total <= items[1].total ? items[0] : items[1];
    var other = cheapest === items[0] ? items[1] : items[0];
    var tie = items[0].total === items[1].total;

    els.recoName.textContent = tie ? "两家相同" : cheapest.name;
    els.recoHint.textContent = tie
      ? "两家总价一样"
      : "比 " + other.name + " 省 " + fmt(other.total - cheapest.total) + unit;

    // 推荐方案
    els.plan.innerHTML =
      '<div class="plan__total">合计 <b>' + fmt(cheapest.total) + unit + "</b></div>" +
      '<div class="plan__split">快递费 ' + fmt(cheapest.fee) + unit +
      " ＋ 箱子成本 " + fmt(box.cost) + unit + "</div>" +
      '<div class="plan__boxes">📦 ' + box.name + "　·　计费重量 " +
      fmtW(info.billable) + "kg　·　按 " + cheapest.name + " 寄</div>";

    // 两家对比
    els.compare.innerHTML = items
      .map(function (x) {
        var best = !tie && x === cheapest;
        return (
          '<div class="cmp' + (best ? " cmp--best" : "") + '">' +
          '<span class="cmp__name">' + x.name +
          (best ? ' <span class="cmp__badge">更划算</span>' : "") + "</span>" +
          '<span class="cmp__price">' + fmt(x.total) + unit + "</span>" +
          '<span class="cmp__sub">快递 ' + fmt(x.fee) +
          " ＋ 箱 " + fmt(box.cost) + "</span>" +
          "</div>"
        );
      })
      .join("");

    // 明细
    var lines = [];
    if (info.mode === "product") {
      info.lines.forEach(function (l) {
        lines.push([
          l.name + " ×" + l.qty + l.unit,
          fmtW(l.kg) + "kg",
        ]);
      });
      lines.push(["产品净重合计", fmtW(info.goodsKg) + "kg"]);
      lines.push(["箱子自重（" + box.name + "）", fmtW(box.weightKg) + "kg"]);
    } else {
      lines.push(["整体重量（已含箱）", fmtW(info.billable) + "kg"]);
    }
    lines.push(["计费总重", fmtW(info.billable) + "kg"]);
    lines.push(["——", ""]);
    lines.push(["箱型", box.name + "（" + fmt(box.cost) + unit + "）"]);
    lines.push(["收货省份", province]);
    lines.push(["始发地", T.origin]);

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
      '<div class="ptr head"><div>箱型</div><div>箱重(kg)</div><div>成本(' +
      unit + ")</div></div>";
    T.boxes.forEach(function (b) {
      html +=
        '<div class="ptr"><div class="zone">' + b.name + "</div>" +
        "<div>" + fmtW(b.weightKg) + "</div><div>" + fmt(b.cost) + "</div></div>";
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
