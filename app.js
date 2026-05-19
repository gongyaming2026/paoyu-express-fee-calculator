/* 泡浴快递费计算器 —— 计算逻辑与界面交互 */
(function () {
  "use strict";

  var T = window.PRICE_TABLE;
  var unit = T.currency || "元";

  // 目的地 -> 行数据 索引
  var byDest = {};
  T.destinations.forEach(function (d) { byDest[d.dest] = d; });

  // 1 位小数四舍五入（带浮点修正，结果与价格比对表一致）
  function r1(n) { return Math.round((n + 1e-9) * 10) / 10; }
  // 显示：整数不带小数，否则最多 1 位
  function fmt(n) {
    var v = r1(n);
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }

  // 单个快递费用：起步价 + MAX(计费重量 − 首重, 0) × 续重价
  function courierFee(c, weightKg) {
    if (weightKg > c.max) return null; // 超出该快递适用重量
    var extra = Math.max(0, weightKg - T.firstWeightKg);
    return r1(c.qi + extra * c.xu);
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
    reco: $("reco"),
    recoName: $("recoName"),
    recoHint: $("recoHint"),
    compare: $("compare"),
    breakdown: $("breakdown"),
    priceTable: $("priceTable"),
  };

  // 省份下拉
  T.destinations.forEach(function (d) {
    var opt = document.createElement("option");
    opt.value = d.dest;
    opt.textContent = d.dest;
    els.province.appendChild(opt);
  });

  // 快捷盒数
  [1, 2, 5, 10, 20, 50].forEach(function (n) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = n + "盒";
    b.addEventListener("click", function () {
      els.boxes.value = n;
      els.boxes.focus();
    });
    els.quick.appendChild(b);
  });

  renderPriceTable();

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

    var weight = r1(boxes * T.boxWeightKg); // 计费重量(KG)

    var feeJt = courierFee(row.jt, weight);
    var feeJd = courierFee(row.jd, weight);

    showResult(boxes, province, weight, feeJt, feeJd);
  });

  function showResult(boxes, province, weight, feeJt, feeJd) {
    // 比较卡片
    var items = [
      { name: T.couriers.jt.name, fee: feeJt },
      { name: T.couriers.jd.name, fee: feeJd },
    ];
    var valid = items.filter(function (x) { return x.fee !== null; });

    if (valid.length === 0) {
      showError("当前重量超出所有快递的承运范围，请联系客服");
      return;
    }

    // 找最便宜
    var cheapest = valid.reduce(function (a, b) {
      return b.fee < a.fee ? b : a;
    });
    var tie =
      valid.length === 2 && valid[0].fee === valid[1].fee;

    els.recoName.textContent = tie ? "两家相同" : cheapest.name;
    if (tie) {
      els.recoHint.textContent = "两家费用一样，均为 " + fmt(cheapest.fee) + unit;
    } else if (valid.length === 2) {
      var other = valid[0] === cheapest ? valid[1] : valid[0];
      els.recoHint.textContent =
        "比 " + other.name + " 便宜 " +
        fmt(other.fee - cheapest.fee) + unit;
    } else {
      els.recoHint.textContent = "另一家不在承运范围";
    }

    // 两家价格对比
    els.compare.innerHTML = items
      .map(function (x) {
        var best = !tie && x.fee !== null && x.fee === cheapest.fee;
        var price =
          x.fee === null
            ? '<span class="cmp__na">不可寄</span>'
            : '<span class="cmp__price">' + fmt(x.fee) + unit + "</span>";
        return (
          '<div class="cmp' + (best ? " cmp--best" : "") + '">' +
          '<span class="cmp__name">' + x.name +
          (best ? ' <span class="cmp__badge">最便宜</span>' : "") +
          "</span>" + price + "</div>"
        );
      })
      .join("");

    // 明细
    var rows = [
      ["收货省份", province],
      ["始发地", T.origin],
      ["泡浴数量", boxes + " 盒（单盒 " + fmt(T.boxWeightKg) + "KG）"],
      ["计费重量", fmt(weight) + " KG"],
    ];
    els.breakdown.innerHTML = rows
      .map(function (kv) {
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
        '<div class="ptr">' +
        '<div class="zone">' + d.dest + "</div>" +
        "<div>" + fmt(d.jt.qi) + " / " + fmt(d.jt.xu) + "</div>" +
        "<div>" + fmt(d.jd.qi) + " / " + fmt(d.jd.xu) + "</div>" +
        "</div>";
    });
    els.priceTable.innerHTML = html;
  }

  function showError(msg) {
    els.error.textContent = msg;
    els.error.hidden = false;
    els.result.hidden = true;
  }
  function hideError() { els.error.hidden = true; }
})();
