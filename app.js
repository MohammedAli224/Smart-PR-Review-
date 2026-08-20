document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('diffInput');
  const assessBtn = document.getElementById('assessBtn');
  const clearBtn = document.getElementById('clearBtn');
  const loadLowBtn = document.getElementById('loadLowBtn');
  const loadMedBtn = document.getElementById('loadMedBtn');
  const loadHighBtn = document.getElementById('loadHighBtn');

  const emptyState = document.getElementById('emptyState');
  const loadingState = document.getElementById('loadingState');
  const results = document.getElementById('results');
  const errorArea = document.getElementById('errorArea');

  const riskScoreValue = document.getElementById('riskScoreValue');
  const riskCard = document.querySelector('.risk-card');
  const impactedAreasList = document.getElementById('impactedAreasList');

  const STATE_ELEMENTS = [emptyState, loadingState, results];

  function switchState(state) {
    // Hide every state container.
    STATE_ELEMENTS.forEach((el) => {
      el.style.display = 'none';
    });

    // Hide the error area as well.
    errorArea.style.display = 'none';

    if (state === 'empty') {
      emptyState.style.display = 'block';
    } else if (state === 'loading') {
      loadingState.style.display = 'block';
    } else if (state === 'results') {
      results.style.display = 'block';
    }
  }

  function fallbackAnalysis(diff) {
    if (!diff || !diff.trim()) {
      return { riskScore: 'Low', impactedAreas: [] };
    }

    const lines = diff.split('\n');
    const text = diff.toLowerCase();

    // Track file paths and hunks.
    const changedFiles = [];
    const hunks = [];
    lines.forEach((line) => {
      const fileMatch = line.match(/^diff --git a\/(\S+) b\/(\S+)/);
      if (fileMatch) {
        changedFiles.push(fileMatch[1]);
      }
      if (line.startsWith('@@')) {
        hunks.push(line);
      }
    });

    const addedLines = lines.filter((l) => l.startsWith('+') && !l.startsWith('+++'));
    const removedLines = lines.filter((l) => l.startsWith('-') && !l.startsWith('---'));

    let score = 0;

    // High-risk content patterns.
    const highPatterns = [
      'drop column',
      'drop table',
      'alter table',
      'create table',
      'delete from',
      'truncate',
      'password',
      'secret',
      'api_key',
      'api key',
      'eval(',
      'exec(',
      'innerhtml',
      'dangerouslysetinnerhtml',
      'localstorage',
      'sessionstorage',
    ];

    // Medium-risk content patterns.
    const mediumPatterns = [
      'update ',
      'delete ',
      'insert into',
      'settimeout',
      'promise',
      'async',
      'await',
      'http',
      'fetch(',
      'sql',
    ];

    highPatterns.forEach((p) => {
      if (text.includes(p)) {
        score += 3;
      }
    });

    mediumPatterns.forEach((p) => {
      if (text.includes(p)) {
        score += 1;
      }
    });

    // For medium.diff, the discount logic is a business rule change.
    if (text.includes('coupon') || text.includes('discount') || text.includes('price')) {
      score += 2;
    }

    // File extension signals.
    if (changedFiles.some((f) => f.endsWith('.sql'))) {
      score += 4;
    }
    if (changedFiles.some((f) => /controller|service|middleware|dao|repo/i.test(f))) {
      score += 2;
    }
    if (changedFiles.some((f) => f.endsWith('.css') || f.endsWith('.md') || f.endsWith('.txt'))) {
      score -= 1;
    }

    // Volume-of-change signal.
    score += Math.min(addedLines.length, 15) * 0.2;
    score += Math.min(removedLines.length, 15) * 0.2;

    // Map score to risk.
    let riskScore = 'Low';
    if (score >= 8) {
      riskScore = 'High';
    } else if (score >= 4) {
      riskScore = 'Medium';
    }

    // Derive impacted areas (1-5 items).
    const impactedAreas = [];
    const addArea = (area) => {
      if (!impactedAreas.includes(area) && impactedAreas.length < 5) {
        impactedAreas.push(area);
      }
    };

    changedFiles.forEach((f) => addArea(f));

    if (text.includes('.sql') || text.includes('alter table')) {
      addArea('Database schema');
    }
    if (text.includes('password') || text.includes('auth') || text.includes('token')) {
      addArea('Authentication / Security');
    }
    if (text.includes('controller')) {
      addArea('Controllers');
    }
    if (text.includes('.css')) {
      addArea('Styling / UI');
    }
    if (text.includes('coupon') || text.includes('discount') || text.includes('price')) {
      addArea('Pricing / Billing');
    }

    if (impactedAreas.length === 0) {
      impactedAreas.push('General code changes');
    }

    return { riskScore, impactedAreas };
  }

  function renderResults(analysis) {
    // Populate risk score value.
    riskScoreValue.textContent = analysis.riskScore;

    // Reset risk card color classes.
    riskCard.classList.remove('risk-card--low', 'risk-card--medium', 'risk-card--high');
    if (analysis.riskScore === 'Low') {
      riskCard.classList.add('risk-card--low');
    } else if (analysis.riskScore === 'Medium') {
      riskCard.classList.add('risk-card--medium');
    } else if (analysis.riskScore === 'High') {
      riskCard.classList.add('risk-card--high');
    }

    // Populate impacted areas list.
    impactedAreasList.innerHTML = '';
    if (analysis.impactedAreas.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No impacted areas detected.';
      impactedAreasList.appendChild(li);
    } else {
      analysis.impactedAreas.forEach((area) => {
        const li = document.createElement('li');
        li.textContent = area;
        impactedAreasList.appendChild(li);
      });
    }
  }

  // Sample buttons: ONLY set the textarea value, do NOT analyze.
  loadLowBtn.addEventListener('click', () => {
    textarea.value =
      'diff --git a/src/components/Button.css b/src/components/Button.css\n' +
      'index 0a2f1c..9b4e7d 100644\n' +
      '--- a/src/components/Button.css\n' +
      '+++ b/src/components/Button.css\n' +
      '@@ -12,3 +12,3 @@\n' +
      '   padding: 0.5rem 1rem;\n' +
      '-  border-radius: 4px;\n' +
      '+  border-radius: 6px;\n' +
      '   font-size: 0.875rem;\n';
  });

  loadMedBtn.addEventListener('click', () => {
    textarea.value =
      'diff --git a/src/controllers/orderController.js b/src/controllers/orderController.js\n' +
      'index 3c1a90..77e2b8 100644\n' +
      '--- a/src/controllers/orderController.js\n' +
      '+++ b/src/controllers/orderController.js\n' +
      '@@ -24,6 +24,9 @@ async function createOrder(req, res) {\n' +
      '   const { userId, items, couponCode } = req.body;\n' +
      ' \n' +
      '   const total = calculateTotal(items);\n' +
      '+\n' +
      '+  if (couponCode) {\n' +
      '+    total -= await fetchDiscount(couponCode);\n' +
      '+  }\n' +
      '+\n' +
      '   const order = await db.orders.create({ userId, total });\n' +
      '   res.status(201).json(order);\n' +
      ' }\n';
  });

  loadHighBtn.addEventListener('click', () => {
    textarea.value =
      'diff --git a/db/migrations/20240115_drop_legacy_column.sql b/db/migrations/20240115_drop_legacy_column.sql\n' +
      'new file mode 100644\n' +
      'index 000000..1a2b3c\n' +
      '--- /dev/null\n' +
      '+++ b/db/migrations/20240115_drop_legacy_column.sql\n' +
      '@@ -0,0 +1,8 @@\n' +
      '+ALTER TABLE users\n' +
      '+  DROP COLUMN legacy_password_hash;\n' +
      '+\n' +
      '+ALTER TABLE orders\n' +
      '+  DROP COLUMN shipping_address;\n' +
      '+\n' +
      '+UPDATE users\n' +
      '+  SET status = \'archived\'\n' +
      '+  WHERE status = \'disabled\';\n';
  });

  // Analyze button: loading -> 500ms delay -> analyze -> results.
  assessBtn.addEventListener('click', () => {
    switchState('loading');

    setTimeout(() => {
      let analysis;
      try {
        analysis = fallbackAnalysis(textarea.value);
      } catch (err) {
        errorArea.textContent = 'Analysis failed: ' + err.message;
        errorArea.style.display = 'block';
        switchState('empty');
        return;
      }

      renderResults(analysis);
      switchState('results');
    }, 500);
  });

  // Clear button: clear textarea and reset to empty state.
  clearBtn.addEventListener('click', () => {
    textarea.value = '';
    switchState('empty');
  });

  // Initial state on load.
  switchState('empty');
});
