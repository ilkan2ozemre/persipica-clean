// Free grader: asks the Pulse API one question for one brand and shows each assistant's answer.
(function () {
  var API = "https://pulse.persipica.com/api/grader/single";
  var NAMES = { gpt: "ChatGPT", claude: "Claude", gemini: "Gemini" };

  var form = document.getElementById("grader-form");
  var brandInput = document.getElementById("brand-input");
  var promptInput = document.getElementById("prompt-input");
  var submit = document.getElementById("grader-submit");
  var errorBox = document.getElementById("grader-error");
  var section = document.getElementById("results-section");
  var grid = document.getElementById("results-grid");
  if (!form) return;

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function render(results) {
    grid.textContent = "";
    results.forEach(function (result, index) {
      var card = el("article", "result card");
      card.style.setProperty("--i", String(index));
      var head = el("div", "result-head");
      head.appendChild(el("h3", null, NAMES[result.provider] || result.provider));
      var failed = !!result.error;
      var status = failed ? "Could not get an answer" : result.mentioned ? "Mentions your brand" : "Does not mention your brand";
      head.appendChild(el("span", "status-pill" + (failed ? " is-error" : result.mentioned ? " is-yes" : ""), status));
      card.appendChild(head);
      if (failed) {
        card.appendChild(el("p", "result-answer", result.error));
      } else {
        card.appendChild(el("p", "result-answer", result.answer || ""));
        var sources = (result.citations || []).map(function (c) { return c.domain; }).filter(Boolean);
        if (sources.length) {
          var list = el("p", "result-sources", "Sources: " + sources.join(", "));
          card.appendChild(list);
        }
      }
      grid.appendChild(card);
    });
    section.hidden = false;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var brand = brandInput.value.trim();
    var prompt = promptInput.value.trim();
    errorBox.hidden = true;
    if (!brand || !prompt) {
      showError("Add your brand and a question to check.");
      return;
    }
    submit.disabled = true;
    submit.textContent = "Asking the assistants";
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand: brand, prompt: prompt })
    })
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data: data }; });
      })
      .then(function (result) {
        if (!result.ok) {
          showError(result.data.error || "The check did not run. Try again in a moment.");
          return;
        }
        render(result.data.results || []);
      })
      .catch(function () {
        showError("Could not reach the checking service. Try again in a moment.");
      })
      .then(function () {
        submit.disabled = false;
        submit.textContent = "Check visibility";
      });
  });
})();
