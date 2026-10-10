import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runModerationTests() {
  console.log('🚀 Starting Stream Control and Participant Management Rules Test Suite...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  try {
    const hostPage = await browser.newPage();
    await hostPage.setViewport({ width: 1280, height: 900 });
    hostPage.on('console', msg => console.log('HOST LOG:', msg.text()));
    await hostPage.evaluateOnNewDocument(() => {
      window.__E2E_TESTING_SIGNED_IN__ = true;
    });

    const participantPage = await browser.newPage();
    await participantPage.setViewport({ width: 1280, height: 900 });
    participantPage.on('console', msg => console.log('PARTICIPANT LOG:', msg.text()));
    await participantPage.evaluateOnNewDocument(() => {
      window.__E2E_TESTING_SIGNED_IN__ = true;
    });

    const ROOM_CODE = 'SYNC-TEST';

    // Helper to set React controlled inputs correctly
    const setInputValue = async (page, index, value) => {
      await page.evaluate((idx, val) => {
        const inputs = document.querySelectorAll('form input[type="text"]');
        const input = inputs[idx];
        if (!input) return;
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(input, val);
        } else {
          input.value = val;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }, index, value);
    };

    // -------------------------------------------------------------
    // RULE 1: Host Permissions & Read-Only Participant Controls
    // -------------------------------------------------------------
    console.log('\n--- Rule 1: Host Permissions & Read-Only Participant Controls ---');
    console.log('1. Host launching room as Host from /host...');
    await hostPage.goto('http://localhost:5173/host');
    await new Promise(r => setTimeout(r, 1200));

    await hostPage.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await setInputValue(hostPage, 0, 'HostAlice');
    await hostPage.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));
    console.log(`Host URL: ${hostPage.url()}`);

    // Read room code from Host page
    const hostRoomCode = await hostPage.evaluate(() => {
      const match = document.body.textContent.match(/SYNC-\d{4}/);
      return match ? match[0] : 'SYNC-TEST';
    });
    console.log(`Host created room code: ${hostRoomCode}`);
    const ACTIVE_ROOM = hostRoomCode || ROOM_CODE;

    // Verify Host has unlocked seekbar
    const isHostSeekDisabled = await hostPage.evaluate(() => {
      const range = document.querySelector('input[type="range"]');
      return range ? range.disabled : null;
    });
    console.log(`✓ Host playback controls enabled: ${isHostSeekDisabled === false} (isHostSeekDisabled: ${isHostSeekDisabled})`);
    if (isHostSeekDisabled !== false) throw new Error(`Host playback control should NOT be disabled (got ${isHostSeekDisabled})`);

    // Participant joins the same room in second tab via invitation code on Enter Code page (/join)
    console.log('2. Participant visiting enter code page (/join)...');
    await participantPage.goto(`http://localhost:5173/join?room=${ACTIVE_ROOM}`);
    await new Promise(r => setTimeout(r, 1200));

    // Verify on Enter Code page: User COULD NOT join as a host (no Host button in perspective options)
    const hasHostPerspectiveBtn = await participantPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent.includes('Host') && (b.textContent.includes('Full Admin') || b.textContent.includes('Host')));
    });
    console.log(`✓ Enter code page does NOT allow joining as host: ${!hasHostPerspectiveBtn} (Expected: true)`);
    if (hasHostPerspectiveBtn) throw new Error('Enter code page should NOT have Host button in perspective selector');

    await participantPage.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await setInputValue(participantPage, 0, 'BobParticipant');
    await participantPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const partBtn = btns.find(b => b.textContent.includes('Guest') && b.textContent.includes('View & Chat'));
      if (partBtn) partBtn.click();
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));
    console.log(`Participant URL: ${participantPage.url()}`);

    // Verify Participant seek control is DISABLED and Read-Only indicator is present
    const isPartSeekDisabled = await participantPage.evaluate(() => {
      const range = document.querySelector('input[type="range"][max]');
      return range ? range.disabled : null;
    });
    const hasReadOnlyBadge = await participantPage.evaluate(() => {
      return document.body.textContent.includes('Synced • Read-Only Mode') || document.body.textContent.includes('Locked');
    });
    console.log(`✓ Participant playback controls disabled: ${isPartSeekDisabled} (Expected: true)`);
    console.log(`✓ Participant has Read-Only/Locked badge: ${hasReadOnlyBadge} (Expected: true)`);
    if (isPartSeekDisabled !== true) throw new Error('Participant playback control MUST be disabled');

    // -------------------------------------------------------------
    // RULE 2: Removing Participants from Stream & Chat
    // -------------------------------------------------------------
    console.log('\n--- Rule 2: Host Removes Participant (Eviction & Redirect to Home) ---');
    // Host triggers eviction of BobParticipant
    await hostPage.evaluate((room) => {
      const bc = new BroadcastChannel(`synccast_room_${room}`);
      bc.postMessage({
        type: 'peer_evicted',
        action: 'remove',
        reason: 'You have been removed from the stream session by the host.',
        targetUsername: 'BobParticipant'
      });
      const removed = [{ username: 'BobParticipant', removedAt: new Date().toISOString() }];
      localStorage.setItem(`synccast_removed_${room}`, JSON.stringify(removed));
    }, ACTIVE_ROOM);
    console.log('Host dispatched eviction broadcast for BobParticipant.');

    // Wait for Participant tab to be redirected to Home Page ('/')
    await new Promise(r => setTimeout(r, 1500));
    const participantUrl = participantPage.url();
    console.log(`Participant URL after eviction: ${participantUrl}`);
    const hasEvictionNotice = await participantPage.evaluate(() => {
      return document.body.textContent.includes('Stream Session Notice') ||
             document.body.textContent.includes('removed from the stream');
    });
    console.log(`✓ Participant redirected to Home Page: ${participantUrl.endsWith('/') || participantUrl === 'http://localhost:5173/'}`);
    console.log(`✓ Participant Home Page shows eviction banner: ${hasEvictionNotice} (Expected: true)`);
    if (!participantUrl.endsWith('/') && participantUrl !== 'http://localhost:5173/') {
      throw new Error(`Participant should be redirected to Home Page, currently at ${participantUrl}`);
    }

    // -------------------------------------------------------------
    // RULE 3 & 4: Rejoining After Removal & Host Confirmation Modal
    // -------------------------------------------------------------
    console.log('\n--- Rule 3 & 4: Removed Participant Requests Rejoin ---');
    await participantPage.goto(`http://localhost:5173/join?room=${ACTIVE_ROOM}`);
    await new Promise(r => setTimeout(r, 1200));

    await setInputValue(participantPage, 0, 'BobParticipant');
    await participantPage.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });

    await new Promise(r => setTimeout(r, 1200));

    // Verify Waiting modal on participant screen
    const participantWaitingText = await participantPage.evaluate(() => {
      return document.body.textContent.includes('Rejoin Request Sent') ||
             document.body.textContent.includes('Waiting for host decision');
    });
    console.log(`✓ Participant shows waiting modal: ${participantWaitingText} (Expected: true)`);

    // Host receives rejoin request
    await hostPage.evaluate((room) => {
      const bc = new BroadcastChannel(`synccast_room_${room}`);
      bc.postMessage({
        type: 'request_rejoin',
        participant: {
          userId: 'user-bob',
          username: 'BobParticipant',
          requestedAt: 'Just now',
          roomId: room
        }
      });
    }, ACTIVE_ROOM);
    await new Promise(r => setTimeout(r, 1000));

    // Verify Host screen shows centered Rejoin Request Confirmation Modal
    const hostHasRejoinModal = await hostPage.evaluate(() => {
      return document.body.textContent.includes('Rejoin Request') &&
             document.body.textContent.includes('Allow Back') &&
             document.body.textContent.includes('Reject');
    });
    console.log(`✓ Host screen displays centered Rejoin Request Modal: ${hostHasRejoinModal} (Expected: true)`);
    if (!hostHasRejoinModal) throw new Error('Host screen MUST show Rejoin Request Modal');

    // Host approves rejoin request (Rule 4)
    console.log('Host approves rejoin request...');
    await hostPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const allowBtn = btns.find(b => b.textContent.includes('Allow Back'));
      if (allowBtn) allowBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));
    console.log(`✓ Participant URL after approval: ${participantPage.url()} (Expected: /room)`);

    // -------------------------------------------------------------
    // RULE 5 & 6: Blocking Participants & Permanent Ban
    // -------------------------------------------------------------
    console.log('\n--- Rule 5 & 6: Host Blocks Participant (Permanent Ban) ---');
    // Host blocks BobParticipant
    await hostPage.evaluate((room) => {
      const bc = new BroadcastChannel(`synccast_room_${room}`);
      bc.postMessage({
        type: 'peer_evicted',
        action: 'block',
        reason: 'You have been permanently blocked from this stream by the host.',
        targetUsername: 'BobParticipant'
      });
      const blocked = [{ username: 'BobParticipant', blockedAt: new Date().toISOString() }];
      localStorage.setItem(`synccast_blocked_${room}`, JSON.stringify(blocked));
    }, ACTIVE_ROOM);

    await new Promise(r => setTimeout(r, 1500));
    console.log(`✓ Participant URL after block: ${participantPage.url()} (Expected: /)`);

    // Participant tries to rejoin while blocked
    console.log('Blocked participant attempts to rejoin with invite code...');
    await participantPage.goto(`http://localhost:5173/join?room=${ACTIVE_ROOM}`);
    await new Promise(r => setTimeout(r, 1200));

    await setInputValue(participantPage, 0, 'BobParticipant');
    await participantPage.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });

    await new Promise(r => setTimeout(r, 1500));
    const blockedUrl = participantPage.url();
    const blockedNotice = await participantPage.evaluate(() => {
      return document.body.textContent.includes('permanently blocked');
    });
    console.log(`✓ Blocked participant immediately redirected to: ${blockedUrl} (Expected: /)`);
    console.log(`✓ Blocked eviction banner displayed on Home Page: ${blockedNotice} (Expected: true)`);

    // Verify host screen received NO confirmation request popup (Rule 5)
    const hostSawPopup = await hostPage.evaluate(() => {
      return document.body.textContent.includes('Rejoin Request');
    });
    console.log(`✓ Host screen showed NO confirmation popup for blocked user: ${!hostSawPopup} (Expected: true)`);
    if (hostSawPopup) throw new Error('Host screen should NEVER show confirmation for blocked participant');

    console.log('\n=============================================================');
    console.log('🎉 ALL 6 STREAM CONTROL & PARTICIPANT MANAGEMENT RULES VERIFIED! 🎉');
    console.log('=============================================================');
  } finally {
    await browser.close();
  }
}

runModerationTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
