const form = document.getElementById("projectForm");
const steps = Array.from(document.querySelectorAll(".form-step"));
const stepItems = Array.from(document.querySelectorAll(".step-item"));
const progressBar = document.getElementById("progressBar");
const progressLabel = document.getElementById("progressLabel");
const alertBox = document.getElementById("formAlert");
const toast = document.getElementById("toast");
const budgetError = document.getElementById("budgetError");
const dateError = document.getElementById("dateError");
const startDateInput = document.getElementById("dataInicio");
const endDateInput = document.getElementById("dataFim");
const supportValueField = document.getElementById("supportValueField");
const submitButton = document.getElementById("submitButton");
const scoreValue = document.getElementById("scoreValue");
const scoreLabel = document.getElementById("scoreLabel");
const scoreBreakdown = document.getElementById("scoreBreakdown");
const summaryContent = document.getElementById("summaryContent");
const successOverlay = document.getElementById("successOverlay");
const successScoreValue = document.getElementById("successScoreValue");
const successScoreLabel = document.getElementById("successScoreLabel");
const successScoreBreakdown = document.getElementById("successScoreBreakdown");
const successSummary = document.getElementById("successSummary");
const expenseList = document.getElementById("expenseList");
const teamList = document.getElementById("teamList");
const expenseTemplate = document.getElementById("expenseTemplate");
const teamTemplate = document.getElementById("teamTemplate");
const saveDraftButton = document.getElementById("saveDraft");

const readLocalSiteConfig = () => {
    try {
        const raw = localStorage.getItem("siteConfig");
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
        return null;
    }
};

const sanitizeFooterHtml = (html) => {
    const allowedTags = new Set(["A", "SPAN", "STRONG", "EM", "B", "I", "BR", "SMALL"]);
    const allowedAttrs = {
        A: new Set(["href", "target", "rel", "class"]),
        SPAN: new Set(["class"]),
        STRONG: new Set(["class"]),
        EM: new Set(["class"]),
        B: new Set(["class"]),
        I: new Set(["class"]),
        BR: new Set([]),
        SMALL: new Set(["class"]),
    };

    const template = document.createElement("template");
    template.innerHTML = String(html ?? "");

    const isSafeHref = (href) => {
        const value = String(href ?? "").trim();
        if (!value) return false;
        if (value.startsWith("#")) return true;
        try {
            const url = new URL(value, location.origin);
            return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:";
        } catch {
            return false;
        }
    };

    const cleanElement = (el) => {
        const tag = el.tagName;
        if (!allowedTags.has(tag)) {
            const text = document.createTextNode(el.textContent || "");
            el.replaceWith(text);
            return;
        }

        Array.from(el.attributes).forEach((attr) => {
            const name = attr.name.toLowerCase();
            const allowed = allowedAttrs[tag] || new Set();
            if (name.startsWith("on")) {
                el.removeAttribute(attr.name);
                return;
            }
            if (!allowed.has(attr.name)) {
                el.removeAttribute(attr.name);
                return;
            }
            if (tag === "A" && attr.name === "href" && !isSafeHref(attr.value)) {
                el.removeAttribute("href");
            }
        });

        if (tag === "A") {
            const target = el.getAttribute("target");
            if (target === "_blank") {
                const rel = (el.getAttribute("rel") || "").trim();
                const parts = new Set(rel.split(/\s+/).filter(Boolean));
                parts.add("noopener");
                parts.add("noreferrer");
                el.setAttribute("rel", Array.from(parts).join(" "));
            }
        }
    };

    const walk = (node) => {
        Array.from(node.children).forEach((child) => {
            walk(child);
            if (child instanceof HTMLElement) cleanElement(child);
        });
    };

    walk(template.content);
    return template.innerHTML;
};

const applySiteConfig = (config) => {
    if (!config || typeof config !== "object") return;

    if (typeof config.pageTitle === "string" && config.pageTitle.trim()) {
        document.title = config.pageTitle;
    }

    const setText = (id, value) => {
        if (typeof value !== "string") return;
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = value;
    };

    setText("brandTitle", config.brandTitle);
    setText("brandSubtitle", config.brandSubtitle);
    setText("statusPill", config.statusPill);
    setText("heroEyebrow", config.heroEyebrow);
    setText("heroTitle", config.heroTitle);
    setText("heroText", config.heroText);

    const logoImg = document.getElementById("brandLogo");
    const markEl = document.getElementById("brandMark");
    if (logoImg && markEl) {
        const logoUrl = typeof config.logoUrl === "string" ? config.logoUrl.trim() : "";
        if (logoUrl) {
            logoImg.src = logoUrl;
            logoImg.alt = typeof config.logoAlt === "string" ? config.logoAlt : "";
            logoImg.classList.remove("is-hidden");
            markEl.classList.add("is-hidden");
        } else {
            logoImg.removeAttribute("src");
            logoImg.alt = "";
            logoImg.classList.add("is-hidden");
            markEl.classList.remove("is-hidden");
        }
    }

    if (typeof config.footerHtml === "string" && config.footerHtml.trim()) {
        const footer = document.getElementById("siteFooter");
        if (footer) footer.innerHTML = sanitizeFooterHtml(config.footerHtml);
    }
};

const loadAndApplySiteConfig = async () => {
    if (location.protocol === "file:") {
        const localConfig = readLocalSiteConfig();
        if (localConfig) applySiteConfig(localConfig);
        return;
    }

    try {
        const response = await fetch("site-config.json", { cache: "no-store" });
        if (!response.ok) throw new Error("Config fetch failed");
        const config = await response.json();
        applySiteConfig(config);
    } catch {
        const localConfig = readLocalSiteConfig();
        if (localConfig) applySiteConfig(localConfig);
    }
};

const stepOrder = ["1", "2", "3", "4", "5", "6", "7", "summary"];
let currentStep = "1";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("is-visible");
    setTimeout(() => toast.classList.remove("is-visible"), 2600);
};

const showAlert = (message) => {
    alertBox.textContent = message;
    alertBox.classList.add("is-visible");
};

const clearAlert = () => {
    alertBox.textContent = "";
    alertBox.classList.remove("is-visible");
};

const updateStepper = () => {
    stepItems.forEach((item) => {
        const step = item.dataset.step;
        const stepIndex = stepOrder.indexOf(step);
        const currentIndex = stepOrder.indexOf(currentStep);
        item.classList.toggle("is-active", step === currentStep);
        item.classList.toggle("is-complete", stepIndex < currentIndex && currentStep !== "summary");
        if (currentStep === "summary") {
            item.classList.add("is-complete");
            item.classList.remove("is-active");
        }
    });
};

const updateProgress = () => {
    if (currentStep === "summary") {
        progressBar.style.width = "100%";
        progressLabel.textContent = "Resumo final";
        return;
    }
    const stepNumber = Number(currentStep);
    progressBar.style.width = `${(stepNumber / 7) * 100}%`;
    progressLabel.textContent = `Etapa ${stepNumber} de 7`;
};

const showStep = (step) => {
    currentStep = step;
    steps.forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.step === step);
    });
    updateStepper();
    updateProgress();
    const prevButton = document.querySelector('[data-action="prev"]');
    const nextButton = document.querySelector('[data-action="next"]');
    prevButton.classList.toggle("is-hidden", step === "1");
    nextButton.classList.toggle("is-hidden", step === "summary");
    submitButton.classList.toggle("is-hidden", step !== "summary");
    if (step === "summary") {
        nextButton.setAttribute("disabled", "true");
    } else {
        nextButton.removeAttribute("disabled");
    }
};

const parseNumber = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    return digits ? Number(digits) / 100 : 0;
};

const formatCurrencyInput = (input, caretPosition) => {
    const rawValue = String(input.value || "");
    const digits = rawValue.replace(/\D/g, "");
    if (!digits) {
        input.value = "";
        return;
    }
    const formatted = currencyFormatter.format(Number(digits) / 100);
    if (typeof caretPosition !== "number") {
        input.value = formatted;
        return;
    }
    const digitsBefore = rawValue.slice(0, caretPosition).replace(/\D/g, "").length;
    input.value = formatted;
    if (document.activeElement !== input) return;
    let position = 0;
    if (digitsBefore === 0) {
        position = formatted.indexOf("0");
        if (position < 0) position = 0;
    } else {
        let count = 0;
        for (let i = 0; i < formatted.length; i += 1) {
            if (/\d/.test(formatted[i])) count += 1;
            if (count >= digitsBefore) {
                position = i + 1;
                break;
            }
        }
    }
    input.setSelectionRange(position, position);
};

const applyDateConstraints = () => {
    const today = new Date();
    const todayIso = today.toISOString().split("T")[0];
    startDateInput.min = todayIso;
    endDateInput.min = todayIso;
};

const syncEndDateMin = () => {
    const todayIso = new Date().toISOString().split("T")[0];
    const startValue = startDateInput.value || todayIso;
    endDateInput.min = startValue > todayIso ? startValue : todayIso;
};

const validateDates = () => {
    const start = startDateInput.value;
    const end = endDateInput.value;
    if (!start || !end) {
        dateError.textContent = "";
        return true;
    }
    if (new Date(end) < new Date(start)) {
        dateError.textContent = "A data de término deve ser posterior à data de início.";
        return false;
    }
    dateError.textContent = "";
    return true;
};

const validateBudget = () => {
    const total = parseNumber(document.getElementById("valorTotal").value);
    const requested = parseNumber(document.getElementById("valorSolicitado").value);
    if (requested > total && total > 0) {
        budgetError.textContent = "O valor solicitado não pode superar o valor total.";
        return false;
    }
    budgetError.textContent = "";
    return true;
};

const validateCheckboxGroup = () => {
    const group = document.querySelector('[data-required-group="audience"]');
    const selected = group.querySelectorAll('input[type="checkbox"]:checked').length;
    const error = document.querySelector('[data-error-for="audience"]');
    if (selected === 0) {
        error.textContent = "Selecione pelo menos um público-alvo.";
        return false;
    }
    error.textContent = "";
    return true;
};

const validateStep = () => {
    clearAlert();
    const panel = steps.find((step) => step.dataset.step === currentStep);
    const inputs = Array.from(panel.querySelectorAll("input, select, textarea"));
    const isValid = inputs.every((input) => input.reportValidity());
    const validations = [];
    if (currentStep === "1") {
        validations.push(validateCheckboxGroup(), validateDates());
    }
    if (currentStep === "3") {
        validations.push(validateBudget());
    }
    if (!isValid || validations.some((valid) => !valid)) {
        showAlert("Revise os campos obrigatórios antes de continuar.");
        return false;
    }
    return true;
};

const buildDynamicItem = (template, container) => {
    const clone = template.content.cloneNode(true);
    container.appendChild(clone);
};

const ensureDefaultItems = () => {
    if (!expenseList.children.length) {
        buildDynamicItem(expenseTemplate, expenseList);
    }
    if (!teamList.children.length) {
        buildDynamicItem(teamTemplate, teamList);
    }
};

const getFormData = () => {
    const files = Array.from(document.getElementById("anexos").files || []);
    const expenses = Array.from(expenseList.querySelectorAll(".dynamic-item")).map((item) => ({
        categoria: item.querySelector('[name="despesaCategoria"]').value,
        valor: parseNumber(item.querySelector('[name="despesaValor"]').value),
    }));
    const team = Array.from(teamList.querySelectorAll(".dynamic-item")).map((item) => ({
        nome: item.querySelector('[name="equipeNome"]').value,
        funcao: item.querySelector('[name="equipeFuncao"]').value,
        contato: item.querySelector('[name="equipeContato"]').value,
    }));
    const publico = Array.from(document.querySelectorAll('[name="publicoAlvo"]:checked')).map(
        (item) => item.value
    );
    return {
        titulo: document.getElementById("titulo").value,
        categoria: document.getElementById("categoria").value,
        descricao: document.getElementById("descricao").value,
        publico,
        periodo: {
            inicio: document.getElementById("dataInicio").value,
            fim: document.getElementById("dataFim").value,
        },
        justificativa: document.getElementById("justificativa").value,
        impactoCurto: document.getElementById("impactoCurto").value,
        impactoLongo: document.getElementById("impactoLongo").value,
        alinhamento: document.getElementById("alinhamento").value,
        orcamento: {
            total: parseNumber(document.getElementById("valorTotal").value),
            solicitado: parseNumber(document.getElementById("valorSolicitado").value),
            despesas: expenses,
            outros: document.querySelector('[name="outrosPatrocinios"]:checked')?.value || "nao",
            valorApoio: parseNumber(document.getElementById("valorApoio").value),
        },
        responsavel: {
            nome: document.getElementById("responsavelNome").value,
            cargo: document.getElementById("responsavelCargo").value,
            contato: document.getElementById("responsavelContato").value,
        },
        equipe: team,
        curriculo: document.getElementById("curriculo").value,
        planoExecucao: document.getElementById("planoExecucao").value,
        planoComunicacao: document.getElementById("planoComunicacao").value,
        planoSustentabilidade: document.getElementById("planoSustentabilidade").value,
        metricas: document.getElementById("metricas").value,
        resultados: document.getElementById("resultados").value,
        arquivos: files.map((file) => file.name),
        referencias: document.getElementById("referencias").value,
    };
};

const scoreByLength = (text, maxLength) => {
    const length = text.trim().length;
    return Math.min(25, Math.round((length / maxLength) * 25));
};

const calculateScore = (data) => {
    const impacto =
        scoreByLength(data.justificativa, 300) +
        scoreByLength(data.impactoCurto, 220) +
        scoreByLength(data.impactoLongo, 220);
    const impactoScore = Math.min(25, Math.round(impacto / 3));
    const alinhamentoScore = scoreByLength(data.alinhamento, 240);
    const clarezaScore = Math.min(
        25,
        Math.round(
            (scoreByLength(data.titulo, 40) +
                scoreByLength(data.descricao, 240) +
                scoreByLength(data.metricas, 240)) /
                3
        )
    );
    const ratio = data.orcamento.total
        ? data.orcamento.solicitado / data.orcamento.total
        : 1;
    let viabilidadeScore = 10;
    if (ratio <= 0.6) viabilidadeScore = 25;
    else if (ratio <= 0.8) viabilidadeScore = 18;
    else if (ratio <= 1) viabilidadeScore = 12;
    viabilidadeScore = Math.min(25, viabilidadeScore + Math.min(5, data.orcamento.despesas.length));

    const total = impactoScore + alinhamentoScore + viabilidadeScore + clarezaScore;
    return {
        total,
        breakdown: {
            impacto: impactoScore,
            alinhamento: alinhamentoScore,
            viabilidade: viabilidadeScore,
            clareza: clarezaScore,
        },
    };
};

const classificationByScore = (total) => {
    if (total >= 80) return "Alta aderência";
    if (total >= 55) return "Média aderência";
    return "Baixa aderência";
};

const getSummarySections = (data) => [
    {
        title: "Informações básicas",
        items: [
            ["Projeto", data.titulo],
            ["Categoria", data.categoria],
            ["Público-alvo", data.publico.join(", ")],
            ["Período", `${data.periodo.inicio} → ${data.periodo.fim}`],
        ],
    },
    {
        title: "Justificativa",
        items: [
            ["Justificativa", data.justificativa],
            ["Impacto curto prazo", data.impactoCurto],
            ["Impacto longo prazo", data.impactoLongo],
            ["Alinhamento", data.alinhamento],
        ],
    },
    {
        title: "Orçamento",
        items: [
            ["Valor total", currencyFormatter.format(data.orcamento.total)],
            ["Valor solicitado", currencyFormatter.format(data.orcamento.solicitado)],
            [
                "Outros apoios",
                data.orcamento.outros === "sim"
                    ? currencyFormatter.format(data.orcamento.valorApoio)
                    : "Não informado",
            ],
            [
                "Despesas",
                data.orcamento.despesas
                    .map((item) => `${item.categoria}: ${currencyFormatter.format(item.valor)}`)
                    .join(" | "),
            ],
        ],
    },
    {
        title: "Equipe",
        items: [
            [
                "Responsável",
                `${data.responsavel.nome} — ${data.responsavel.cargo} (${data.responsavel.contato})`,
            ],
            [
                "Equipe executora",
                data.equipe.map((item) => `${item.nome} (${item.funcao})`).join(" | "),
            ],
            ["Currículo", data.curriculo],
        ],
    },
    {
        title: "Viabilidade",
        items: [
            ["Plano de execução", data.planoExecucao],
            ["Plano de comunicação", data.planoComunicacao],
            ["Plano de sustentabilidade", data.planoSustentabilidade],
        ],
    },
    {
        title: "Métricas",
        items: [
            ["Métricas", data.metricas],
            ["Resultados", data.resultados],
        ],
    },
    {
        title: "Documentos",
        items: [
            ["Arquivos", data.arquivos.length ? data.arquivos.join(", ") : "Não anexado"],
            ["Referências", data.referencias],
        ],
    },
];

const renderSummaryContent = (container, data) => {
    container.innerHTML = "";
    getSummarySections(data).forEach((section) => {
        const wrapper = document.createElement("div");
        wrapper.className = "summary-section";
        const title = document.createElement("h4");
        title.textContent = section.title;
        const list = document.createElement("div");
        list.className = "summary-list";
        section.items.forEach(([label, value]) => {
            const item = document.createElement("div");
            const strong = document.createElement("strong");
            strong.textContent = label;
            const span = document.createElement("span");
            span.textContent = `: ${value || "Não informado"}`;
            item.appendChild(strong);
            item.appendChild(span);
            list.appendChild(item);
        });
        wrapper.appendChild(title);
        wrapper.appendChild(list);
        container.appendChild(wrapper);
    });
};

const renderScore = (score, scoreEl, labelEl, breakdownEl) => {
    scoreEl.textContent = `${score.total}`;
    labelEl.textContent = classificationByScore(score.total);
    breakdownEl.innerHTML = "";
    Object.entries(score.breakdown).forEach(([label, value]) => {
        const item = document.createElement("div");
        item.textContent = `${label}: ${value}/25`;
        breakdownEl.appendChild(item);
    });
};

const renderSummary = (data, score) => {
    renderSummaryContent(summaryContent, data);
    renderScore(score, scoreValue, scoreLabel, scoreBreakdown);
};

const renderSuccess = (data, score) => {
    renderSummaryContent(successSummary, data);
    renderScore(score, successScoreValue, successScoreLabel, successScoreBreakdown);
};

const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => {
        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };
        return map[char] || char;
    });

const buildPrintableHtml = (data, score) => {
    const sectionsHtml = getSummarySections(data)
        .map(
            (section) => `
            <div class="section">
                <h2>${escapeHtml(section.title)}</h2>
                ${section.items
                    .map(
                        ([label, value]) =>
                            `<div class="item"><strong>${escapeHtml(
                                label
                            )}</strong><span>${escapeHtml(value || "Não informado")}</span></div>`
                    )
                    .join("")}
            </div>`
        )
        .join("");

    const breakdownHtml = Object.entries(score.breakdown)
        .map(([label, value]) => `<div>${escapeHtml(label)}: ${value}/25</div>`)
        .join("");

    const dateLabel = new Date().toLocaleString("pt-BR");

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Resumo do Projeto</title>
<style>
body { font-family: "Inter", Arial, sans-serif; color: #0f172a; padding: 32px; }
h1 { font-size: 24px; margin: 0 0 6px; }
.meta { color: #64748b; margin-bottom: 24px; font-size: 13px; }
.score { font-size: 32px; color: #1e3a8a; font-weight: 700; }
.score-label { color: #475569; margin: 4px 0 8px; }
.score-breakdown { font-size: 13px; color: #475569; margin-bottom: 20px; display: grid; gap: 4px; }
.section { margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
.section h2 { font-size: 16px; margin: 0 0 8px; }
.item { display: grid; grid-template-columns: 160px 1fr; gap: 8px; font-size: 13px; margin-bottom: 6px; }
.item strong { color: #1f2937; }
.item span { color: #475569; }
</style>
</head>
<body>
<h1>Projeto cultural</h1>
<div class="meta">Gerado em ${escapeHtml(dateLabel)}</div>
<div class="score">${score.total}</div>
<div class="score-label">${escapeHtml(classificationByScore(score.total))}</div>
<div class="score-breakdown">${breakdownHtml}</div>
${sectionsHtml}
</body>
</html>`;
};

const openPdf = (data, score) => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
        showToast("Permita pop-up para salvar o PDF.");
        return;
    }
    printWindow.document.open();
    printWindow.document.write(buildPrintableHtml(data, score));
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
    };
};

const handleSupportToggle = () => {
    const selected = document.querySelector('[name="outrosPatrocinios"]:checked')?.value;
    supportValueField.classList.toggle("is-hidden", selected !== "sim");
    if (selected !== "sim") {
        document.getElementById("valorApoio").value = "";
    }
};

if (form) {
    loadAndApplySiteConfig();

    form.addEventListener("click", (event) => {
        const action = event.target.dataset.action;
        if (!action) return;
        if (action === "add-expense") {
            buildDynamicItem(expenseTemplate, expenseList);
        }
        if (action === "add-team") {
            buildDynamicItem(teamTemplate, teamList);
        }
        if (action === "remove-item") {
            const item = event.target.closest(".dynamic-item");
            if (item && item.parentElement) {
                item.parentElement.removeChild(item);
            }
        }
        if (action === "prev") {
            clearAlert();
            const currentIndex = stepOrder.indexOf(currentStep);
            if (currentIndex > 0) {
                showStep(stepOrder[currentIndex - 1]);
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        }
        if (action === "next") {
            if (!validateStep()) return;
            const currentIndex = stepOrder.indexOf(currentStep);
            const nextStep = stepOrder[currentIndex + 1];
            if (nextStep) {
                if (nextStep === "summary") {
                    const data = getFormData();
                    const score = calculateScore(data);
                    renderSummary(data, score);
                }
                showStep(nextStep);
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        }
    });

    form.addEventListener("change", (event) => {
        if (event.target.name === "outrosPatrocinios") {
            handleSupportToggle();
        }
    });

    form.addEventListener("input", (event) => {
        if (event.target.matches("[data-currency]")) {
            formatCurrencyInput(event.target, event.target.selectionStart);
        }
        if (event.target.id === "dataInicio") {
            syncEndDateMin();
            validateDates();
        }
        if (event.target.id === "dataFim") {
            validateDates();
        }
        if (event.target.id === "valorTotal" || event.target.id === "valorSolicitado") {
            validateBudget();
        }
        if (event.target.name === "publicoAlvo") {
            validateCheckboxGroup();
        }
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!validateStep()) return;
        submitButton.setAttribute("disabled", "true");
        submitButton.textContent = "Enviando...";
        setTimeout(() => {
            const data = getFormData();
            const score = calculateScore(data);
            renderSuccess(data, score);
            submitButton.textContent = "Enviar projeto";
            submitButton.removeAttribute("disabled");
            successOverlay.classList.remove("is-hidden");
        }, 1400);
    });

    saveDraftButton?.addEventListener("click", () => {
        showToast("Rascunho salvo localmente.");
    });

    document.addEventListener("click", (event) => {
        const action = event.target.dataset.action;
        if (action === "save-success") {
            const data = getFormData();
            const score = calculateScore(data);
            openPdf(data, score);
        }
        if (action === "new-project") {
            successOverlay.classList.add("is-hidden");
            form.reset();
            expenseList.innerHTML = "";
            teamList.innerHTML = "";
            ensureDefaultItems();
            handleSupportToggle();
            applyDateConstraints();
            syncEndDateMin();
            showStep("1");
        }
    });

    ensureDefaultItems();
    handleSupportToggle();
    applyDateConstraints();
    syncEndDateMin();
    showStep("1");
}
