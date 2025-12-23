document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Basic sanity checks to detect DOM issues early
  if (!activitiesList) console.error('app.js: #activities-list element not found');
  if (!activitySelect) console.error('app.js: #activity select element not found');
  if (!signupForm) console.error('app.js: #signup-form element not found');
  if (!messageDiv) console.error('app.js: #message element not found');

  // Example activities now include participants
  const activities = [
    {
      id: 1,
      title: 'Kayaking Trip',
      description: 'Join us for a scenic kayak on the lake.',
      participants: ['Alice Johnson', 'Sam Lee', 'Ravi Patel']
    },
    {
      id: 2,
      title: 'Trail Run',
      description: '5k trail run through the hills.',
      participants: []
    }
    // ...existing activities...
  ];

  // Helper: render participants block for a single card (avoids duplicating full participants.js)
  function renderParticipantsForCard(card, participants = []) {
    if (card.querySelector('.participants')) return;
    const container = document.createElement('div');
    container.className = 'participants';
    const title = document.createElement('h5');
    title.textContent = 'Participants';
    container.appendChild(title);

    if (!participants || participants.length === 0) {
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
        avatar.textContent = (name || '').split(/\s+/).slice(0,2).map(n=>n[0]?.toUpperCase()).join('');
        const pname = document.createElement('span');
        pname.className = 'participant-name';
        pname.textContent = name;

        const remove = document.createElement('button');
        remove.className = 'participant-remove';
        remove.type = 'button';
        remove.setAttribute('aria-label', `Remove ${name}`);
        remove.textContent = '✕';
        remove.addEventListener('click', (e) => {
          e.stopPropagation();

          // Update the in-memory activities array if this card was created from it
          const aid = card.getAttribute('data-activity-id');
          if (aid) {
            const act = activities.find(a => String(a.id) === String(aid));
            if (act && Array.isArray(act.participants)) {
              const ix = act.participants.indexOf(name);
              if (ix !== -1) act.participants.splice(ix, 1);
            }
          }

          // remove from DOM
          li.remove();

          // If looks like an email and the card has a title, call backend to unregister
          const title = card.querySelector('h4') ? card.querySelector('h4').textContent.trim() : '';
          if (name && name.includes('@') && title) {
            fetch(`/activities/${encodeURIComponent(title)}/unregister?email=${encodeURIComponent(name)}`, { method: 'POST' })
              .catch(() => {});
          }
        });

        li.appendChild(avatar);
        li.appendChild(pname);
        li.appendChild(remove);
        list.appendChild(li);
      });
      container.appendChild(list);
    }

    card.appendChild(container);
  }

  // Remove any existing activity cards with the same title to avoid duplicates
  function removeCardsWithTitle(title) {
    if (!title) return;
    const all = document.querySelectorAll('.activity-card');
    all.forEach(c => {
      const t = c.querySelector('h4') ? c.querySelector('h4').textContent.trim() : '';
      if (t === title) c.remove();
    });
  }

  // Helper: add a participant to a matching activity card in the DOM
  function addParticipantToCard(title, participant) {
    const sanitize = t => (t || '').trim();
    const findCardIn = (container) => Array.from(container.querySelectorAll('.activity-card')).find(c => sanitize((c.querySelector('h4')||{}).textContent) === sanitize(title));

    const activitiesContainer = document.getElementById('activities');
    const listContainer = document.getElementById('activities-list');
    let card = findCardIn(activitiesContainer) || (listContainer ? findCardIn(listContainer) : null);
    if (!card) return;

    // If participants block exists, append a new list item
    const participantsList = card.querySelector('.participants-list');
    const makeListItem = (name) => {
      const li = document.createElement('li');
      li.className = 'participant';

      const avatar = document.createElement('span');
      avatar.className = 'participant-avatar';
      avatar.textContent = (name || '').split(/\s+/).slice(0,2).map(n=>n[0]?.toUpperCase()).join('');

      const pname = document.createElement('span');
      pname.className = 'participant-name';
      pname.textContent = name;

      const remove = document.createElement('button');
      remove.className = 'participant-remove';
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove ${name}`);
      remove.textContent = '✕';
      remove.addEventListener('click', (e) => {
        e.stopPropagation();
        li.remove();
        const titleText = card.querySelector('h4') ? card.querySelector('h4').textContent.trim() : '';
        if (name && name.includes('@') && titleText) {
          fetch(`/activities/${encodeURIComponent(titleText)}/unregister?email=${encodeURIComponent(name)}`, { method: 'POST' }).catch(()=>{});
        }
      });

      li.appendChild(avatar);
      li.appendChild(pname);
      li.appendChild(remove);
      return li;
    };

    if (participantsList) {
      participantsList.appendChild(makeListItem(participant));
    } else {
      // create participants block with this single participant
      card.setAttribute('data-participants', JSON.stringify([participant]));
      renderParticipantsForCard(card, [participant]);
    }
  }

  // Render activities (ensure data-participants is present and participants are displayed)
  function renderActivities() {
    const container = document.getElementById('activities');
    // ...existing code to clear container...
    container.innerHTML = ''; // simple reset (replace with existing logic if different)

    activities.forEach(activity => {
      // Remove any existing duplicate cards with same title first
      removeCardsWithTitle(activity.title);

      const card = document.createElement('div');
      card.className = 'activity-card';
      if (activity.id) card.setAttribute('data-activity-id', activity.id);
      // expose participants for participants.js or for debugging
      card.setAttribute('data-participants', JSON.stringify(activity.participants || []));
      // ...existing code that adds title/description...
      const h4 = document.createElement('h4');
      h4.textContent = activity.title;
      const p = document.createElement('p');
      p.textContent = activity.description;
      card.appendChild(h4);
      card.appendChild(p);

      // render participants block right away so dynamically-added cards show participants
      renderParticipantsForCard(card, activity.participants || []);

      container.appendChild(card);
    });
  }

  // Function to fetch activities from API
  // Populate the activities list from the local `activities` array
  function populateFromLocal() {
    console.log('populateFromLocal: populating from sample activities');
    if (!activitiesList) {
      console.error('populateFromLocal: #activities-list not found; aborting population');
      return;
    }

    activitiesList.innerHTML = '';
    // reset select
    if (!activitySelect) {
      console.error('populateFromLocal: #activity select not found; cannot populate dropdown');
    } else {
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
    }

    // show a brief notice so it's obvious in the UI while items are appended
    const notice = document.createElement('p');
    notice.className = 'info';
    notice.textContent = 'Loading sample activities...';
    activitiesList.appendChild(notice);

    activities.forEach(act => {
      console.log('populateFromLocal: adding activity', act.title);

      // Skip if this activity is already represented in the short list
      const alreadyInList = activitiesList && Array.from(activitiesList.querySelectorAll('.activity-card')).some(c => (c.querySelector('h4')||{}).textContent.trim() === act.title);

      if (!alreadyInList) {
        // Remove any other cards with the same title and append this one
        removeCardsWithTitle(act.title);

        const activityCard = document.createElement('div');
        activityCard.className = 'activity-card';
        if (act.id) activityCard.setAttribute('data-activity-id', act.id);
        activityCard.setAttribute('data-participants', JSON.stringify(act.participants || []));
        activityCard.innerHTML = `
          <h4>${act.title}</h4>
          <p>${act.description}</p>
        `;

        activitiesList.appendChild(activityCard);
        renderParticipantsForCard(activityCard, act.participants || []);
      } else {
        console.log('populateFromLocal: skipping duplicate activity for', act.title);
      }

      if (activitySelect) {
        const exists = Array.from(activitySelect.options).some(o => o.value === act.title);
        if (!exists) {
          const option = document.createElement('option');
          option.value = act.title;
          option.textContent = act.title;
          activitySelect.appendChild(option);
        }
      }
    });

    // remove notice if items were appended
    const remainedNotice = activitiesList.querySelector('p.info');
    if (remainedNotice) remainedNotice.remove();

    // final sanity: log counts
    console.log('populateFromLocal: finished, activities-count=', activities.length, 'dropdown-options=', activitySelect ? activitySelect.options.length : 0);
  }

  async function fetchActivities() {
    console.log('fetchActivities: attempting to fetch /activities');
    try {
      const response = await fetch("/activities");
      if (!response.ok) throw new Error('Network response not ok');
      const serverActivities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      if (!serverActivities || Object.keys(serverActivities).length === 0) {
        // nothing from server, fallback to local
        activitiesList.innerHTML = '<p>No activities available from server. Showing sample activities.</p>';
        populateFromLocal();
        return;
      }

      // Populate activities list from server data (be tolerant of response shapes)
      console.log('fetchActivities: serverActivities keys:', Object.keys(serverActivities));
      Object.entries(serverActivities).forEach(([name, details]) => {
        console.log('fetchActivities: processing activity', name, details);
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        // determine participants array if available, otherwise use empty
        const participantsArray = Array.isArray(details.participants) ? details.participants : [];
        // fallback: if server returned a participants_count (number), we still show availability but don't attempt to render participants
        const serverParticipantsCount = typeof details.participants_count === 'number' ? details.participants_count : (participantsArray.length || 0);

        activityCard.setAttribute('data-participants', JSON.stringify(participantsArray));

        const max = details.max_participants || 0;
        const spotsLeft = max - serverParticipantsCount;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description || ''}</p>
          <p><strong>Schedule:</strong> ${details.schedule || 'TBD'}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Remove any existing duplicates and then append the server-supplied card
        removeCardsWithTitle(name);
        activitiesList.appendChild(activityCard);

        // render participants block for server-supplied participants if we have them
        if (participantsArray.length > 0) {
          renderParticipantsForCard(activityCard, participantsArray);
        }

        // Add option to select dropdown (avoid duplicates)
        if (activitySelect) {
          const exists = Array.from(activitySelect.options).some(o => o.value === name);
          if (!exists) {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            activitySelect.appendChild(option);
          }
        }
      });

      // Ensure local sample activities (e.g., Kayaking Trip, Trail Run) remain available
      // in the select if the server doesn't include them. This merges local samples
      // with server-supplied activities so the UI remains useful.
      if (activitySelect) {
        activities.forEach(act => {
          const exists = Array.from(activitySelect.options).some(o => o.value === act.title);
          if (!exists) {
            const opt = document.createElement("option");
            opt.value = act.title;
            opt.textContent = act.title;
            activitySelect.appendChild(opt);
          }
        });
      }
    } catch (error) {
      console.error("fetchActivities: error fetching activities", error);
      activitiesList.innerHTML = "<p>Failed to load activities. Showing sample activities.</p>";
      // fallback to local sample activities
      populateFromLocal();
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;

    try {
      const url = `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}${name ? `&name=${encodeURIComponent(name)}` : ''}`;
      const response = await fetch(url, { method: "POST" });

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message || 'Signed up successfully';
        messageDiv.className = "message success";

        // update local activities array if it matches title
        const participantLabel = name || email;
        const act = activities.find(a => a.title === activity || String(a.id) === String(activity));
        if (act) {
          if (!Array.isArray(act.participants)) act.participants = [];
          act.participants.push(participantLabel);
          renderActivities();
        } else {
          // if not in local array, try to update the rendered card(s)
          addParticipantToCard(activity, participantLabel);
        }

        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || result.message || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle adding a new activity and parsing participants from an optional input
  const form = document.getElementById('new-activity-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // ...existing code to read title/description...
      const titleInput = form.querySelector('[name="title"], #title');
      const descInput = form.querySelector('[name="description"], #description');
      const participantsInput = form.querySelector('[name="participants"], #participants');

      const title = titleInput ? titleInput.value.trim() : 'Untitled';
      const description = descInput ? descInput.value.trim() : '';
      let participants = [];
      if (participantsInput && participantsInput.value) {
        participants = participantsInput.value.split(',').map(s => s.trim()).filter(Boolean);
      }

      const newActivity = {
        id: Date.now(),
        title,
        description,
        participants
      };
      activities.push(newActivity);
      renderActivities();

      // ...existing code to reset form / show message...
      form.reset();
    });
  }

  // Initialize app
  // Pre-populate the available activities and dropdown from local samples so the UI is usable even before server responds
  populateFromLocal();

  // initial render for the activities section
  renderActivities();

  // then try to fetch fresh data from the server and replace if available
  fetchActivities();
});
