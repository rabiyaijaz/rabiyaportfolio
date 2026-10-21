import { PROFILE } from '../content/projects.js';
import useTitle from '../lib/useTitle.js';
import { useSim } from '../lib/simState.jsx';
import StoryHeader from '../ui/StoryHeader.jsx';
import PlumbobCanvas from '../ui/PlumbobCanvas.jsx';
import ContactForm from '../ui/ContactForm.jsx';
import Socials from '../ui/Socials.jsx';

export default function Contact() {
  useTitle('Contact');
  const { fulfil } = useSim();
  return (
    <main id="main" className="contact-page">
      <div className="story-wrap contact-grid">
        <div>
          <StoryHeader
            as="h1" label="Contact"
            title={<>Working on something <em>people actually use?</em></>}
            lede="I take on product design projects and roles, and I’m always up for a conversation about AI products people can trust."
          />
          <ContactForm />
          <p className="story-kicker contact__notes-title">Or find me on</p>
          <Socials />
          <ul className="contact__links">
            <li><a href={PROFILE.cv} download onClick={() => fulfil('cv')}>CV (PDF) ↓</a></li>
            <li className="muted">{PROFILE.location} · works remotely</li>
          </ul>
        </div>
        <PlumbobCanvas className="contact__bob" ending from={30} to={99} />
      </div>
    </main>
  );
}
