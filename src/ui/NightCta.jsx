import { Link } from 'react-router-dom';
import StoryHeader from './StoryHeader.jsx';
import PlumbobCanvas from './PlumbobCanvas.jsx';
import Socials from './Socials.jsx';

/** The day ends the same way on every page: lights out, a green plumbob, a note on the doorstep.
 *  Its plumbob is in "ending" mode: nothing scrolls past it, so it animates on time and on input. */
export default function NightCta({ title = <>Let’s build something <em>people actually use.</em></> }) {
  return (
    <section className="night night--band" aria-labelledby="cta-title">
      <div className="story-wrap night__grid">
        <div>
          <StoryHeader label="Contact" id="cta-title" title={title} lede="Open to new product design projects in human–AI collaboration." />
          <div className="hood__actions">
            <Link className="button" to="/contact">Send me a message <span aria-hidden="true">→</span></Link>
            <Socials compact />
          </div>
        </div>
        <PlumbobCanvas className="night__bob" ending from={30} to={99} />
      </div>
    </section>
  );
}
