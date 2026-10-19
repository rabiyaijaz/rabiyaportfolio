import { useState } from 'react';
import { useSim } from '../lib/simState.jsx';
import { sfx } from '../lib/audio.js';

// Formspark (https://formspark.io): messages are emailed to the address set on the form in the
// Formspark dashboard (rabiyaijaz99@gmail.com). Put the form ID in app/.env as VITE_FORMSPARK_ID=xxxxxxx.
// The chosen topic becomes the email subject via Formspark's flat `_email.subject` field.
const FORM_ID = import.meta.env.VITE_FORMSPARK_ID;
const TOPICS = ['A project', 'A role', 'Just hello'];

export default function ContactForm() {
  const { fulfil } = useSim();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    if (data._honeypot) return; // bots fill hidden fields
    if (!FORM_ID) { setState('error'); setError('The form isn’t connected yet. Please use the email link for now.'); return; }
    setState('sending'); setError('');
    try {
      const res = await fetch(`https://submit-form.com/${FORM_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ topic, name: data.name, email: data.email, message: data.message, '_email.subject': `${topic} · ${data.name} (via portfolio)` }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState('sent'); form.reset(); fulfil('letter'); sfx('complete');
    } catch {
      setState('error'); setError('That didn’t send. Please try again, or use the email link below.');
    }
  };

  if (state === 'sent') {
    return (
      <div className="cform cform--sent" role="status">
        <p className="cform__sent-title">Message sent. Thank you!</p>
        <p className="muted">I usually reply within a couple of days.</p>
        <button className="ghost-button" onClick={() => setState('idle')}>Send another</button>
      </div>
    );
  }

  return (
    <form className="cform" onSubmit={submit} noValidate={false}>
      <fieldset className="cform__topics">
        <legend>What’s it about?</legend>
        {TOPICS.map((t) => (
          <label key={t} className={topic === t ? 'is-on' : ''}>
            <input type="radio" name="topic" value={t} checked={topic === t} onChange={() => setTopic(t)} />{t}
          </label>
        ))}
      </fieldset>
      <div className="cform__row">
        <label className="cform__field"><span>Name</span><input name="name" required autoComplete="name" maxLength={120} /></label>
        <label className="cform__field"><span>Email</span><input name="email" type="email" required autoComplete="email" maxLength={200} /></label>
      </div>
      <label className="cform__field"><span>Message</span><textarea name="message" required rows={5} maxLength={4000} placeholder="Tell me a little about what you’re working on." /></label>
      <input type="text" name="_honeypot" tabIndex={-1} autoComplete="off" className="cform__hp" aria-hidden="true" />
      <div className="cform__actions">
        <button className="button" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send message'}</button>
        {error && <p className="cform__error" role="alert">{error}</p>}
      </div>
    </form>
  );
}
