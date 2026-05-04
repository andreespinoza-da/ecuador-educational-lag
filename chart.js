/* chart.js — Ecuador Education: Over-age Attendance Analysis
   TBA vs TNA paired line chart with shaded gap band
   Data source: INEC / ENEMDU 2003–2017
*/

const LEVELS = ['Primaria', 'EGB', 'Secundaria', 'Bachillerato'];
const LEVEL_LABELS = {
  Primaria:     'Primaria',
  EGB:          'Ed. General Básica',
  Secundaria:   'Secundaria',
  Bachillerato: 'Bachillerato',
};
const LEVEL_AGES = {
  Primaria:     '6–11 años',
  EGB:          '5–14 años',
  Secundaria:   '12–17 años',
  Bachillerato: '15–17 años',
};
const translations = {
  es: {
    eyebrow:        'Ecuador · INEC / ENEMDU · 2003–2017',
    title:          'Rezago escolar y asistencia fuera de edad',
    subtitle:       'La <strong>Tasa Bruta de Asistencia (TBA)</strong> cuenta a todos los alumnos que asisten a un nivel educativo sin importar su edad mientras que la <strong>Tasa Neta (TNA)</strong> cuenta solo a quienes tienen la edad oficial para ese nivel. La brecha entre ambas—el área sombreada—revela la proporción de estudiantes con <strong>rezago</strong>: personas asistiendo a un nivel que deberían haber superado.',
    area_label:     'Área geográfica',
    nacional:       'Nacional',
    urbano:         'Urbano',
    rural:          'Rural',
    level_primaria: 'Primaria',
    level_egb:      'Ed. General Básica',
    level_sec:      'Secundaria',
    level_bach:     'Bachillerato',
    ages_primaria:  'Edad oficial: 6–11 años',
    ages_egb:       'Edad oficial: 5–14 años',
    ages_sec:       'Edad oficial: 12–17 años',
    ages_bach:      'Edad oficial: 15–17 años',
    legend_tba:     'Tasa Bruta de Asistencia: todos los alumnos del nivel, cualquier edad',
    legend_tna:     'Tasa Neta de Asistencia: solo alumnos en edad oficial',
    legend_band:    'Brecha: proporción de asistencia fuera de edad (rezago)',
    legend_100:     'Referencia 100%',
    footnote_1:     'Fuente: INEC — Encuesta Nacional de Empleo, Desempleo y Subempleo (ENEMDU), diciembre 2003–2017.',
    footnote_2:     "Nota: TBA de primaria rural 2005 excluida por error en fuente original (marcador de pie de página 'g'). pp = puntos porcentuales.",
    tooltip_year:   'AÑO',
    tooltip_tba:    'Tasa Bruta',
    tooltip_tna:    'Tasa Neta',
    tooltip_gap:    'Brecha',
    tooltip_pp:     'pp',
  },
  en: {
    eyebrow:        'Ecuador · INEC / ENEMDU · 2003–2017',
    title:          'Grade retention or Educational lag in Ecuador',
    subtitle:       '<strong>Tasa Bruta de Asistencia (TBA)</strong>, or <strong>Gross Attendance Rate</strong>, is the percentage of students attending a certain level of education, regardless of their age, while <strong>Tasa Neta de Asistencia (TNA)</strong>, or <strong>Net Attendance Rate</strong>, represents attendance by students within the official age range for that level, as a percentage of the total population of that age group. The difference between these two measures, the shadowed area, is the percentage of students with <strong>educational lag</strong> in Ecuador between 2003–2017.',
    area_label:     'Geographic area',
    nacional:       'National',
    urbano:         'Urban',
    rural:          'Rural',
    level_primaria: 'Primary (approx. Grades 1–6)',
    level_egb:      'General Basic Education',
    level_sec:      'Secondary',
    level_bach:     'Bachillerato (approx. Grades 10–12)',
    ages_primaria:  'Official age: 6–11 years old',
    ages_egb:       'Official age: 5–14 years old',
    ages_sec:       'Official age: 12–17 years old',
    ages_bach:      'Official age: 15–17 years old',
    legend_tba:     'Gross Attendance Rate: all students enrolled in the level, regardless of their age',
    legend_tna:     'Net Attendance Rate: only enrolled students within the age range of that level',
    legend_band:    'Educational Gap: proportion of students enrolled in an educational level but outside that level&apos;s age range',
    legend_100:     'Reference: 100%',
    footnote_1:     'Source: INEC — Encuesta Nacional de Empleo, Desempleo y Subempleo (ENEMDU), diciembre 2003–2017.',
    footnote_2:     'Note: TBA (Gross Attendance Rate) for primary, rural 2005 was excluded due to missing data in the source dataset. pp = percentage points.',
    tooltip_year:   'YEAR',
    tooltip_tba:    'Gross Attendance Rate',
    tooltip_tna:    'Net Attendance Rate',
    tooltip_gap:    'Educational Gap',
    tooltip_pp:     'pp',
  }
};

let currentLang = 'es';
let currentArea = 'nacional';
let rawData = null;

// ── bootstrap ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetch('education_data.json')
    .then(r => r.json())
    .then(data => {
      rawData = data;
      setupControls();
      setLanguage('es');
    })
    .catch(err => {
      document.querySelector('.charts-grid').innerHTML =
        `<p style="color:#e05a5a;padding:24px;">Error loading data: ${err.message}</p>`;
    });
});

// ── controls ───────────────────────────────────────────────────────────────
function setupControls() {
  document.querySelectorAll('.area-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentArea = btn.dataset.area;
      document.querySelectorAll('.area-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAll();
    });
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });
}

// ── render all panels ──────────────────────────────────────────────────────
function renderAll() {
  document.querySelectorAll('.chart-svg').forEach(el => el.innerHTML = '');
  LEVELS.forEach(level => drawPanel(level));
}
// -- Change language
function setLanguage(lang) {
  currentLang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = translations[lang][key];
    if (val !== undefined) el.innerHTML = val;
  });

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  renderAll();
}

// ── single panel ───────────────────────────────────────────────────────────
function drawPanel(level) {
  const container = document.getElementById(`chart-${level}`);
  if (!container) return;

  const W = container.clientWidth  || 460;
  const H = container.clientHeight || 260;
  const margin = { top: 12, right: 24, bottom: 32, left: 42 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top  - margin.bottom;

  const tbaData = rawData[level][currentArea].tba;
  const tnaData = rawData[level][currentArea].tna;

  // align years present in both series for the band
  const tbaMap = new Map(tbaData.map(d => [d.year, d.value]));
  const tnaMap = new Map(tnaData.map(d => [d.year, d.value]));
  const sharedYears = [...tbaMap.keys()].filter(y => tnaMap.has(y)).sort((a,b) => a-b);
  const bandData = sharedYears.map(y => ({ year: y, tba: tbaMap.get(y), tna: tnaMap.get(y) }));

  // scales
  const allVals = [...tbaData.map(d => d.value), ...tnaData.map(d => d.value)];
  const yMin = Math.floor(Math.min(...allVals) / 10) * 10;
  const yMax = Math.ceil(Math.max(...allVals) / 10) * 10 + 5;
  const allYears = [...new Set([...tbaData, ...tnaData].map(d => d.year))].sort((a,b) => a-b);

  const x = d3.scaleLinear()
    .domain(d3.extent(allYears))
    .range([0, innerW]);

  const y = d3.scaleLinear()
    .domain([yMin, yMax])
    .range([innerH, 0]);

  const svg = d3.select(`#chart-${level}`)
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // gridlines
  const yTicks = y.ticks(5);
  g.selectAll('.gridline')
    .data(yTicks)
    .join('line')
      .attr('class', 'gridline')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', d => y(d)).attr('y2', d => y(d));

  // 100% reference line
  if (yMax >= 100 && yMin <= 105) {
    g.append('line')
      .attr('class', 'hundred-line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', y(100)).attr('y2', y(100));

    g.append('text')
      .attr('x', innerW + 2)
      .attr('y', y(100) + 3)
      .attr('fill', 'rgba(192,57,43,0.5)')
      .attr('font-size', 9)
      .attr('font-family', 'IBM Plex Mono, monospace')
      .text('100%');
  }

  // 2007 reference line
  const year2007 = x(2007);
  g.append('line')
    .attr('x1', year2007).attr('x2', year2007)
    .attr('y1', 0).attr('y2', innerH)
    .attr('stroke', 'rgba(181, 31, 108, 0.8)')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4 3');

  g.append('text')
    .attr('x', year2007 + 4)
    .attr('y', 10)
    .attr('fill', 'rgba(155, 123, 94, 0.7)')
    .attr('font-size', 9)
    .attr('font-family', 'IBM Plex Mono, monospace')
    .text('2007');

  // shaded band (TNA → TBA)
  const area = d3.area()
    .x(d => x(d.year))
    .y0(d => y(d.tna))
    .y1(d => y(d.tba))
    .curve(d3.curveMonotoneX);

  g.append('path')
    .datum(bandData)
    .attr('class', 'band')
    .attr('d', area);

  // line generators
  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.value))
    .defined(d => d.value != null)
    .curve(d3.curveMonotoneX);

  g.append('path').datum(tbaData).attr('class', 'line-tba').attr('d', line);
  g.append('path').datum(tnaData).attr('class', 'line-tna').attr('d', line);

  // axes
  const xAxis = d3.axisBottom(x)
    .tickValues(allYears.filter((_, i) => i % 3 === 0 || i === allYears.length - 1))
    .tickFormat(d => `'${String(d).slice(2)}`)
    .tickSize(4);

  const yAxis = d3.axisLeft(y)
    .ticks(5)
    .tickFormat(d => d + '%')
    .tickSize(4);

  g.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0,${innerH})`)
    .call(xAxis);

  g.append('g')
    .attr('class', 'axis axis--y')
    .call(yAxis);

  // invisible hit area for tooltip
  const tooltip = document.getElementById('tooltip');

  const bisect = d3.bisector(d => d.year).left;

  const overlay = g.append('rect')
    .attr('width', innerW)
    .attr('height', innerH)
    .attr('fill', 'transparent')
    .style('cursor', 'crosshair');

  // vertical hover line
  const hoverLine = g.append('line')
    .attr('y1', 0).attr('y2', innerH)
    .attr('stroke', 'rgba(255,255,255,0.15)')
    .attr('stroke-width', 1)
    .attr('pointer-events', 'none')
    .attr('opacity', 0);

  overlay.on('mousemove', function(event) {
    const [mx] = d3.pointer(event);
    const year = Math.round(x.invert(mx));
    const tbaVal = tbaMap.get(year);
    const tnaVal = tnaMap.get(year);
    if (tbaVal == null && tnaVal == null) return;

    hoverLine.attr('x1', x(year)).attr('x2', x(year)).attr('opacity', 1);

    const gap = (tbaVal != null && tnaVal != null)
      ? (tbaVal - tnaVal).toFixed(1)
      : '—';

    const t = translations[currentLang];

    tooltip.innerHTML = `
      <div class="tooltip__year">${t.tooltip_year} ${year}</div>
      <div class="tooltip__row">
        <span class="tooltip__label">${t.tooltip_tba}</span>
        <span class="tooltip__val tooltip__val--tba">${tbaVal != null ? tbaVal.toFixed(1)+'%' : '—'}</span>
      </div>
      <div class="tooltip__row">
        <span class="tooltip__label">${t.tooltip_tna}</span>
        <span class="tooltip__val tooltip__val--tna">${tnaVal != null ? tnaVal.toFixed(1)+'%' : '—'}</span>
      </div>
      <div class="tooltip__gap">${t.tooltip_gap}: +${gap} ${t.tooltip_pp}</div>
    `;

    const rect = container.closest('.chart-card').getBoundingClientRect();
    tooltip.style.left = (event.clientX + 16) + 'px';
    tooltip.style.top  = (event.clientY - 40) + 'px';
    tooltip.classList.add('visible');
  });

  overlay.on('mouseleave', () => {
    hoverLine.attr('opacity', 0);
    tooltip.classList.remove('visible');
  });
}

// ── responsive resize ──────────────────────────────────────────────────────
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(renderAll, 150);
});
