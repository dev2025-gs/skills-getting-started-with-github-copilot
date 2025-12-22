(function () {
  function getInitials(name) {
    if (!name) return '';
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map(n => n[0]?.toUpperCase() || '')
      .join('');
  }

  function parseParticipants(raw) {
    if (!raw) return [];
    // already an array (e.g. data attribute could be set by JS)
    if (Array.isArray(raw)) return raw;
    // try JSON
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // ignore
    }
    // fallback: comma separated
    return String(raw)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  function renderForCard(card) {
    // Avoid re-rendering if already present
    if (card.querySelector('.participants')) return;

    const raw = card.getAttribute('data-participants') || '';
    const participants = parseParticipants(raw);

    const container = document.createElement('div');
    container.className = 'participants';
    const title = document.createElement('h5');
    title.textContent = 'Participants';
    container.appendChild(title);

    if (participants.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'participants-empty';
      empty.textContent = 'No participants yet.';
      container.appendChild(empty);
    } else {
      const list = document.createElement('ul');
      list.className = 'participants-list';
      participants.forEach(name => {
        const li = document.createElement('li');
        li.className = 'participant';

        const avatar = document.createElement('span');
        avatar.className = 'participant-avatar';
        avatar.textContent = getInitials(name);

        const pname = document.createElement('span');
        pname.className = 'participant-name';
        pname.textContent = name;

        li.appendChild(avatar);
        li.appendChild(pname);
        list.appendChild(li);
      });
      container.appendChild(list);
    }

    card.appendChild(container);
  }

  // Render on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.activity-card').forEach(renderForCard);
    });
  } else {
    document.querySelectorAll('.activity-card').forEach(renderForCard);
  }
})();
