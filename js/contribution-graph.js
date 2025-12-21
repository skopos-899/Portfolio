/**
 * Contribution Graph Visualization
 * Displays a GitHub-style activity heatmap showing project contributions over time
 * Data: projects with year, category, and status information
 * 
 * Structure: 
 * - Grid of contribution squares (one per project/timeframe)
 * - Color intensity based on activity level
 * - Tooltips on hover showing project name and details
 */

// Contribution graph: 52-week GitHub-style calendar for the past 365 days
// Builds an activity map keyed by ISO date (YYYY-MM-DD) from project date fields,
// renders a 52-week (past 365 days) calendar, shows tooltips, supports click-to-filter,
// marks pinned dates (>=1 project), and recent pulse for last 7 days.
// Exposes ContributionGraph on window.

class ContributionGraph {
    constructor(containerId = 'contribution-graph') {
        this.container = document.getElementById(containerId);
        this.projects = [];
        this.activityMap = {}; // { 'YYYY-MM-DD': [project,...] }
        this.selectedDate = null;
        this.tooltip = null;
    }

    init(projects = []) {
        // Accept either an array of projects or an object { projects, advancementEvents }
        if (projects && typeof projects === 'object' && !Array.isArray(projects)) {
            this.projects = Array.isArray(projects.projects) ? projects.projects : [];
            this.advancementEvents = Array.isArray(projects.advancementEvents) ? projects.advancementEvents : [];
            this.advancements = Array.isArray(projects.advancements) ? projects.advancements : [];
        } else {
            this.projects = Array.isArray(projects) ? projects : [];
            this.advancementEvents = [];
            this.advancements = [];
        }
        this.buildActivityMap();
        this.render();
    }

    // Try multiple fields and coerce to YYYY-MM-DD if possible
    static extractISODate(project) {
        const candidates = [
            project && project.date,
            project && project.addedDate,
            project && project.added,
            project && project['Date']
        ];

        for (let raw of candidates) {
            if (!raw && raw !== 0) continue;
            if (typeof raw === 'string') {
                raw = raw.trim();
                                // Normalize Unicode digits (e.g., Nepali numerals) to ASCII
                                raw = raw.replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660))
                                          .replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06F0))
                                          .replace(/[\u07C0-\u07C9]/g, d => String(d.charCodeAt(0) - 0x07C0))
                                          .replace(/[\u0966-\u096F]/g, d => String(d.charCodeAt(0) - 0x0966));
                const isoMatch = raw.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})/);
                if (isoMatch) {
                    const y = isoMatch[1], m = isoMatch[2], d = isoMatch[3];
                    return `${y}-${m}-${d}`;
                }
                const parsed = Date.parse(raw);
                if (!isNaN(parsed)) {
                    const dt = new Date(parsed);
                    return ContributionGraph.toISODate(dt);
                }
            } else if (raw instanceof Date) {
                return ContributionGraph.toISODate(raw);
            } else if (typeof raw === 'number') {
                let millis = raw;
                if (raw < 1e12) millis = raw * 1000;
                const dt = new Date(millis);
                if (!isNaN(dt.getTime())) return ContributionGraph.toISODate(dt);
            }
        }
        return null;
    }

    static toISODate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    buildActivityMap() {
        this.activityMap = {};
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - 364); // inclusive last 365 days

        // Map projects by name to enrich advancement events where possible
        const projectsByName = {};

        // Helper to add an activity for a date while avoiding duplicates
        const addActivity = (iso, proj) => {
            if (!iso) return;
            if (!this.activityMap[iso]) this.activityMap[iso] = [];
            const list = this.activityMap[iso];
            const exists = list.some(existing => {
                // Prefer comparing by id when available
                if (existing && existing.id && proj && proj.id) return String(existing.id) === String(proj.id);
                // Fallback to project name comparison (case-insensitive)
                const en = (existing && (existing.name || existing['Project Name'] || existing.projectName) || '').toString().trim().toLowerCase();
                const pn = (proj && (proj.name || proj['Project Name'] || proj.projectName) || '').toString().trim().toLowerCase();
                return en && pn && en === pn;
            });
            if (!exists) list.push(proj);
        };

        this.projects.forEach(project => {
            const name = (project.name || project['Project Name'] || project['Project'] || '').trim();
            if (name) projectsByName[name.toLowerCase()] = project;
            const iso = ContributionGraph.extractISODate(project);
            if (!iso) return;
            const dt = new Date(iso + 'T00:00:00');
            if (isNaN(dt.getTime())) return;
            if (dt < start || dt > today) return;
            addActivity(iso, project);
        });

        // Include advancement events as individual activity entries
        if (Array.isArray(this.advancementEvents) && this.advancementEvents.length) {
            this.advancementEvents.forEach(ev => {
                const dateField = ev.date || ev.Date || ev['Date'] || ev['date'];
                const rawName = (ev.projectName || ev['Project Name'] || ev['project'] || ev['projectName'] || '').trim();
                const iso = (() => {
                    if (!dateField) return null;
                    if (typeof dateField === 'string') {
                        const parsed = Date.parse(dateField);
                        if (!isNaN(parsed)) return ContributionGraph.toISODate(new Date(parsed));
                    } else if (dateField instanceof Date) {
                        return ContributionGraph.toISODate(dateField);
                    } else if (typeof dateField === 'number') {
                        let ms = dateField < 1e12 ? dateField * 1000 : dateField;
                        const dt = new Date(ms);
                        if (!isNaN(dt.getTime())) return ContributionGraph.toISODate(dt);
                    }
                    return null;
                })();
                if (!iso) return;
                const dt = new Date(iso + 'T00:00:00');
                if (dt < start || dt > today) return;
                const matched = projectsByName[rawName.toLowerCase()] || null;
                if (matched) addActivity(iso, matched);
                else addActivity(iso, { name: rawName || '(advancement)', _isAdvancementEvent: true });
            });
        }

        // Include Advancement sheet rows (advancements) — treat advancementCount === 0 as the initial contribution
        if (Array.isArray(this.advancements) && this.advancements.length) {
            this.advancements.forEach(ad => {
                const dateField = ad.date || ad.Date || ad['Date'] || ad['date'];
                if (!dateField) return;
                let iso = null;
                if (typeof dateField === 'string') {
                    const parsed = Date.parse(dateField);
                    if (!isNaN(parsed)) iso = ContributionGraph.toISODate(new Date(parsed));
                } else if (dateField instanceof Date) {
                    iso = ContributionGraph.toISODate(dateField);
                } else if (typeof dateField === 'number') {
                    let ms = dateField < 1e12 ? dateField * 1000 : dateField;
                    const dt = new Date(ms);
                    if (!isNaN(dt.getTime())) iso = ContributionGraph.toISODate(dt);
                }
                if (!iso) return;
                const dt = new Date(iso + 'T00:00:00');
                if (dt < start || dt > today) return;
                // Only treat advancementCount === 0 as the initial contribution
                const countVal = Number(ad.advancementCount || ad.AdvancementCount || ad.count || 0);
                if (countVal === 0) {
                    const rawName = (ad.projectName || ad['Project Name'] || ad.project || '').trim();
                    const matched = projectsByName[rawName.toLowerCase()] || null;
                    if (matched) addActivity(iso, matched);
                    else addActivity(iso, { name: rawName || '(advancement)', _isAdvancementEvent: true });
                }
            });
        }
    }

    getLevelFromCount(count) {
        if (!count || count <= 0) return 0;
        if (count === 1) return 1;
        if (count === 2) return 2;
        if (count === 3) return 3;
        return 4;
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'contribution-container';

        const header = document.createElement('div');
        header.className = 'contribution-header';
        header.innerHTML = `
            <h4 class="contribution-title">Activity (past 365 days)</h4>
            <div class="contribution-legend">
                <span>Less</span>
                <div class="legend-squares">
                    <span class="legend-square level-0"></span>
                    <span class="legend-square level-1"></span>
                    <span class="legend-square level-2"></span>
                    <span class="legend-square level-3"></span>
                    <span class="legend-square level-4"></span>
                </div>
                <span>More</span>
            </div>
        `;
        wrapper.appendChild(header);

        const cal = document.createElement('div');
        cal.className = 'contrib-calendar';

        const monthsRow = document.createElement('div');
        monthsRow.className = 'contrib-months';

        const daysPerWeek = 7;

        const today = new Date();
        today.setHours(0,0,0,0);

        // Start date is 364 days ago (to cover 365 days total)
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 364);
        startDate.setHours(0,0,0,0);

        // Align grid to the previous Sunday so columns represent full weeks
        const firstGridDate = new Date(startDate);
        const startWeekday = firstGridDate.getDay();
        firstGridDate.setDate(firstGridDate.getDate() - startWeekday);

        const MS_DAY = 1000 * 60 * 60 * 24;
        const totalDays = Math.ceil((today.getTime() - firstGridDate.getTime()) / MS_DAY) + 1;
        const weeks = Math.ceil(totalDays / 7);

        const grid = Array.from({ length: weeks }, () => Array(daysPerWeek).fill(null));

        // Fill the grid with Date objects for positions between startDate..today
        for (let i = 0; i < weeks * 7; i++) {
            const cursor = new Date(firstGridDate);
            cursor.setDate(firstGridDate.getDate() + i);
            const weekIndex = Math.floor(i / 7);
            const weekday = cursor.getDay();
            // Only include dates within the desired 365-day window
            if (cursor >= startDate && cursor <= today) {
                grid[weekIndex][weekday] = new Date(cursor);
            } else {
                grid[weekIndex][weekday] = null;
            }
        }

        // Set CSS custom property for dynamic grid column count (accounts for 53/54 week windows)
        monthsRow.style.setProperty('--grid-weeks', weeks);
        monthsRow.style.gridTemplateColumns = `repeat(${weeks}, 12px)`;
        monthsRow.style.columnGap = '4px';

        // Build per-column statistics to determine month header starts and spans
        const colStats = Array.from({ length: weeks }, () => ({ counts: {}, dates: [], hasDay1: false, day1Key: null }));
        for (let w = 0; w < weeks; w++) {
            const columnDates = grid[w].filter(d => d);
            for (const dt of columnDates) {
                const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
                colStats[w].counts[key] = (colStats[w].counts[key] || 0) + 1;
                colStats[w].dates.push(dt);
                if (dt.getDate() === 1) {
                    colStats[w].hasDay1 = true;
                    colStats[w].day1Key = key;
                }
            }
        }

        // Determine month header start positions using the day-1 rule
        const monthStarts = [];
        let firstColWithDate = 0;
        while (firstColWithDate < weeks && colStats[firstColWithDate].dates.length === 0) firstColWithDate++;
        if (firstColWithDate < weeks) {
            const firstKey = `${colStats[firstColWithDate].dates[0].getFullYear()}-${String(colStats[firstColWithDate].dates[0].getMonth() + 1).padStart(2, '0')}`;
            monthStarts.push({ key: firstKey, start: firstColWithDate });
        }

        const seen = new Set(monthStarts.map(s => s.key));
        for (let w = firstColWithDate; w < weeks; w++) {
            const cs = colStats[w];
            if (!cs.hasDay1) continue;
            const newKey = cs.day1Key;
            if (seen.has(newKey)) continue;

            const countNew = cs.counts[newKey] || 0;
            let countPrev = 0;
            for (const k in cs.counts) {
                if (k !== newKey) countPrev += cs.counts[k];
            }

            let start = w;
            if (!(countNew > countPrev)) {
                start = w + 1;
            }
            if (start < weeks) {
                monthStarts.push({ key: newKey, start });
                seen.add(newKey);
            }
        }

        monthStarts.sort((a, b) => a.start - b.start);

        // Compute spans for each month header
        const monthHeaders = [];
        for (let i = 0; i < monthStarts.length; i++) {
            const { key, start } = monthStarts[i];
            if (start >= weeks) continue;
            let span = 0;
            for (let c = start; c < weeks; c++) {
                if ((colStats[c].counts[key] || 0) > 0) span++;
                else break;
            }
            if (span > 0) {
                let labelDate = null;
                for (let c = start; c < start + span; c++) {
                    if (colStats[c].dates.length) { labelDate = colStats[c].dates[0]; break; }
                }
                const label = labelDate ? labelDate.toLocaleString(undefined, { month: 'short' }) : key.split('-')[1];
                monthHeaders.push({ start, span, label });
            }
        }

        // Render month header elements with inline grid-column placement
        for (const mh of monthHeaders) {
            const monthLabel = document.createElement('div');
            monthLabel.className = 'contrib-month';
            monthLabel.textContent = mh.label;
            monthLabel.style.gridColumn = `${mh.start + 1} / span ${mh.span}`;
            monthsRow.appendChild(monthLabel);
        }

        for (let w = 0; w < weeks; w++) {
            const weekCol = document.createElement('div');
            weekCol.className = 'contrib-week';
            for (let d = 0; d < daysPerWeek; d++) {
                const dt = grid[w][d];
                const dayEl = document.createElement('button');
                dayEl.type = 'button';
                dayEl.className = 'contrib-day';
                dayEl.setAttribute('aria-label', 'No activity');

                if (dt) {
                    const iso = ContributionGraph.toISODate(dt);
                    const projects = this.activityMap[iso] || [];
                    const count = projects.length;
                    const level = this.getLevelFromCount(count);
                    dayEl.dataset.date = iso;
                    dayEl.dataset.count = String(count);
                    dayEl.dataset.level = String(level);

                    if (count > 0) dayEl.classList.add('pinned');

                    const dtCheck = new Date(iso + 'T00:00:00');
                    const diffDays = Math.floor(((new Date().setHours(0,0,0,0)) - dtCheck) / (1000*60*60*24));
                    if (count > 0 && diffDays >= 0 && diffDays <= 6) {
                        dayEl.classList.add('recent');
                    }

                    dayEl.classList.add(`level-${level}`);
                    const title = `${iso} — ${count} project${count !== 1 ? 's' : ''}`;
                    dayEl.title = title;

                    // start invisible for fade-in (only for real day cells)
                    dayEl.style.opacity = '0';
                } else {
                    dayEl.classList.add('empty');
                    dayEl.disabled = true;
                }

                weekCol.appendChild(dayEl);
            }
            cal.appendChild(weekCol);
        }

        // Wrap calendar in scrollable wrapper
        const calWrapper = document.createElement('div');
        calWrapper.className = 'contrib-calendar-wrapper';
        calWrapper.appendChild(monthsRow);
        calWrapper.appendChild(cal);

        wrapper.appendChild(calWrapper);
        this.container.appendChild(wrapper);

        // After DOM insertion, trigger a RAF to animate fade-in of non-empty days
        requestAnimationFrame(() => {
            const days = wrapper.querySelectorAll('.contrib-day');
            days.forEach(el => {
                if (!el.classList.contains('empty')) {
                    el.style.opacity = '1';
                }
            });
        });

        this.createTooltip();
        this.attachEvents();
    }

    createTooltip() {
        let tip = document.querySelector('.contrib-tooltip');
        if (!tip) {
            tip = document.createElement('div');
            tip.className = 'contrib-tooltip';
            document.body.appendChild(tip);
        }
        this.tooltip = tip;
    }

    attachEvents() {
        const self = this;
        this.container.querySelectorAll('.contrib-day').forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                const date = el.dataset.date;
                if (!date) return;
                const projects = self.activityMap[date] || [];
                const tip = self.tooltip;
                if (!tip) return;
                tip.innerHTML = self.buildTooltipContent(date, projects);
                tip.style.display = 'block';
                const rect = el.getBoundingClientRect();
                tip.style.left = (rect.left + rect.width / 2) + 'px';
                tip.style.top = (rect.top - 8) + 'px';
                tip.style.transform = 'translate(-50%, -100%)';
            });
            el.addEventListener('mouseleave', () => {
                if (self.tooltip) self.tooltip.style.display = 'none';
            });

            // keyboard accessibility: focus and activate via Enter/Space
            el.addEventListener('focus', (e) => {
                const date = el.dataset.date;
                if (!date) return;
                const projects = self.activityMap[date] || [];
                const tip = self.tooltip;
                if (!tip) return;
                tip.innerHTML = self.buildTooltipContent(date, projects);
                tip.style.display = 'block';
            });
            el.addEventListener('blur', () => {
                if (self.tooltip) self.tooltip.style.display = 'none';
            });
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const date = el.dataset.date;
                    if (!date) return;
                    // Emit a global event with detail for modal to consume
                    const projects = self.activityMap[date] || [];
                    window.dispatchEvent(new CustomEvent('contrib:open', { detail: { date, projects } }));
                }
            });

            el.addEventListener('click', () => {
                const date = el.dataset.date;
                if (!date) return;
                const projects = self.activityMap[date] || [];
                // Open modal with project list via custom event
                window.dispatchEvent(new CustomEvent('contrib:open', { detail: { date, projects } }));
                // also toggle visual selection locally
                if (this.selectedDate === date) {
                    this.clearSelection();
                } else {
                    this.selectDate(date);
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target) && this.selectedDate) {
                this.clearSelection();
            }
        });
    }

    buildTooltipContent(date, projects) {
        if (!projects || projects.length === 0) {
            return `<div class="tooltip-title">${date}</div><div class="tooltip-empty">No projects</div>`;
        }
        const list = projects.map(p => `<li class="tooltip-item">${p.name || '(untitled)'}</li>`).join('');
        return `<div class="tooltip-title">${date}</div><ul class="tooltip-list">${list}</ul>`;
    }

    selectDate(date) {
        this.selectedDate = date;
        this.container.querySelectorAll('.contrib-day').forEach(el => {
            el.classList.toggle('selected', el.dataset.date === date);
        });
        this.applyProjectFilter(date);
    }

    clearSelection() {
        this.selectedDate = null;
        this.container.querySelectorAll('.contrib-day.selected').forEach(el => el.classList.remove('selected'));
        this.clearProjectFilter();
    }

    applyProjectFilter(date) {
        const cards = document.querySelectorAll('.project-card');
        let any = false;
        cards.forEach(card => {
            const cardDate = card.getAttribute('data-date');
            if (cardDate && cardDate === date) {
                card.classList.add('highlighted');
                card.style.opacity = '1';
                any = true;
            } else {
                card.classList.remove('highlighted');
                card.style.opacity = '0.25';
            }
        });
        if (!any) {
            cards.forEach(card => card.style.opacity = '0.25');
        }
    }

    clearProjectFilter() {
        document.querySelectorAll('.project-card').forEach(card => {
            card.classList.remove('highlighted');
            card.style.opacity = '';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.ContributionGraph = ContributionGraph;
});
