import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '@fontsource/noto-nastaliq-urdu/400.css';
import '@fontsource/noto-naskh-arabic/400.css';
import ROUNDS from '../content/addaRounds.json';
import { ICONS, WIDE } from './icons.jsx';
import './adda.css';
import { getAudio } from '../lib/audio.js';
import Arrow from '../ui/Arrow.jsx';

/*
 * Access Adda: a three-round card game about accessibility in real Peshawar places.
 * Each round deals Place, Person, Situation and Barrier; you play one intervention
 * card from your hand and see what it changes, scored on four WCAG principles.
 */

const DIMS = ['independence', 'perceivability', 'understandability', 'operability'];
const LANGS = [['en', 'EN'], ['ur', 'اردو'], ['ps', 'پښتو']];

// UI copy. The card-type, score and before/after strings come from the original game's translations.
const UI = {
  en: {
    tagline: 'Peshawar, for everyone', place: 'Place', person: 'Person', situation: 'Situation', barrier: 'Barrier',
    intro: 'Each round deals a place, a person, a situation and a barrier. Play the intervention card that removes the barrier.',
    deal: 'Deal the cards', hand: 'Your hand: pick an intervention', play: 'Play this card', round: (n) => `Round ${n} of 3`,
    inclusive: 'Inclusive solution', partial: 'Partial fix', stays: 'The barrier stays',
    before: 'Before: the barrier', after: 'After: inclusive solution', reveal: 'See the inclusive card', next: 'Next round', finish: 'See your impact',
    impact: 'Your design impact', again: 'Play again', principle: 'Design principle',
    independence: 'Independence', perceivability: 'Perceivability', understandability: 'Understandability', operability: 'Operability',
    ranks: ['Keep exploring', 'Good neighbour', 'Adda champion'], sound: 'Sound', of: 'of',
    pickFirst: 'Select a card to play', tip: 'Tip: double-tap a card to play it straight away',
  },
  ur: {
    tagline: 'سب کے لیے پشاور', place: 'مقام', person: 'انسان', situation: 'صورتحال', barrier: 'رکاوٹ',
    intro: 'ہر راؤنڈ میں ایک مقام، ایک انسان، ایک صورتحال اور ایک رکاوٹ ملتی ہے۔ وہ پتا کھیلیں جو رکاوٹ دور کرے۔',
    deal: 'پتے بانٹیں', hand: 'آپ کے پتے: حل منتخب کریں', play: 'یہ پتا کھیلیں', round: (n) => `راؤنڈ ${n} / 3`,
    inclusive: 'جامع حل', partial: 'ادھورا حل', stays: 'رکاوٹ برقرار ہے',
    before: 'پہلے: درپیش رکاوٹ', after: 'بعد میں: جامع حل', reveal: 'جامع حل دیکھیں', next: 'اگلا چیلنج', finish: 'اپنا اثر دیکھیں',
    impact: 'آپ کے ڈیزائن کا اثر', again: 'دوبارہ کھیلیں', principle: 'جامع ڈیزائن کا اصول',
    independence: 'خود مختاری', perceivability: 'سمجھنے کی صلاحیت', understandability: 'وضاحت', operability: 'استعمال کی آسانی',
    ranks: ['مزید سیکھیں', 'اچھا پڑوسی', 'اڈا چیمپئن'], sound: 'آواز', of: 'میں سے',
    pickFirst: 'کھیلنے کے لیے پتا منتخب کریں', tip: 'فوراً کھیلنے کے لیے پتے پر دو بار ٹیپ کریں',
  },
  ps: {
    tagline: 'د ټولو لپاره پېښور', place: 'ځای', person: 'انسان', situation: 'حالت', barrier: 'خنډ',
    intro: 'په هر پړاو کې یو ځای، یو انسان، یو حالت او یو خنډ راځي. هغه کارت ولوبوئ چې خنډ لرې کوي.',
    deal: 'کارتونه ووېشئ', hand: 'ستاسو کارتونه: یو حل غوره کړئ', play: 'دا کارت ولوبوئ', round: (n) => `پړاو ${n} / 3`,
    inclusive: 'ټولشموله حل', partial: 'نیمګړی حل', stays: 'خنډ پاتې دی',
    before: 'مخکې: شته خنډ', after: 'وروسته: ټولشموله حل', reveal: 'ټولشموله حل وګورئ', next: 'بل چیلنج', finish: 'خپل اغېز وګورئ',
    impact: 'ستاسو د ډیزاین اغېز', again: 'بیا ولوبوئ', principle: 'د ټولشموله ډیزاین اصل',
    independence: 'خپلواکي', perceivability: 'د درک وړتیا', understandability: 'پوهېدل', operability: 'کړنې آساني',
    ranks: ['نور وپلټئ', 'ښه ګاونډی', 'د اډې اتل'], sound: 'غږ', of: 'له',
    pickFirst: 'د لوبې لپاره یو کارت غوره کړئ', tip: 'سمدستي لوبې لپاره پر کارت دوه ځله ټک وکړئ',
  },
};

// Pictograms for cards without illustrations
const ART = {
  im_sciences_stairs: { situation: 'exam', barrier: 'stairs' },
  board_bazar_payment: { situation: 'rushPay', barrier: 'fadingCheck' },
  local_bus_route_encoding: { place: 'bus', person: 'elder', situation: 'buses', barrier: 'colorBands' },
};

// Text for a round in the chosen language, falling back to English per field
function roundText(r, lang) {
  const en = r.en, tr = lang === 'en' ? null : r[lang];
  const pick = (k, fallback) => (tr && tr[k]) || fallback;
  return {
    place: { title: pick('placeTitle', en.place.title), desc: pick('placeDesc', en.place.desc), name: r.placeName[lang] || r.placeName.en },
    person: { name: pick('personName', en.person.name), role: pick('personRole', en.person.role), tech: pick('personTech', en.person.assistiveTech), context: pick('personContext', en.person.contextType), age: en.person.age },
    situation: { title: pick('situationTitle', en.situation.title), desc: pick('situationDesc', en.situation.desc) },
    barrier: { title: pick('barrierTitle', en.barrier.title), desc: pick('barrierDesc', en.barrier.desc) },
    options: en.options.map((o) => ({ ...o, title: tr?.options?.[o.id]?.title || o.title, desc: tr?.options?.[o.id]?.desc || o.desc, critique: tr?.options?.[o.id]?.critique || o.critique })),
    before: pick('beforeText', en.consequence.beforeText),
    after: pick('afterText', en.consequence.afterText),
    principle: { title: pick('principleTitle', en.principle.title), desc: pick('principleDesc', en.principle.description) },
    wcag: en.principle.wcag,
  };
}

// The original game's sound set (from its Game-Sound-Effects pack), trimmed and compressed.
// deal: card whoosh · select: coin click · good: chime · meh: soft donk · win: confetti
const SOUND_FILES = { deal: 'deal', select: 'select', play: 'select', good: 'good', meh: 'meh', win: 'win' };
const VOLUME = { deal: 0.5, select: 0.45, play: 0.55, good: 0.6, meh: 0.55, win: 0.6 };

function useSound(on) {
  const cache = useRef({});
  return useCallback((kind, delay = 0) => {
    const site = getAudio(); // the site-wide sound button wins over the game's own toggle
    if (!on || site.muted || !site.sfx || !SOUND_FILES[kind]) return;
    const go = () => {
      const src = `/sounds/adda/${SOUND_FILES[kind]}.mp3`;
      const base = cache.current[src] ||= new Audio(src);
      const a = base.cloneNode(); // allows overlapping plays (e.g. four cards dealt)
      a.volume = VOLUME[kind];
      a.play().catch(() => {});
    };
    delay ? setTimeout(go, delay) : go();
  }, [on]);
}

export default function AccessAdda() {
  const [lang, setLang] = useState('en');
  const [sound, setSound] = useState(true);
  const [phase, setPhase] = useState('intro'); // intro | dealt | result | summary
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState(null);
  const [played, setPlayed] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [history, setHistory] = useState([]);
  const [announce, setAnnounce] = useState('');
  const rootRef = useRef(null);
  const resultRef = useRef(null);
  const handRef = useRef(null);
  const play = useSound(sound);
  const ui = UI[lang];
  const r = ROUNDS[round];
  const t = useMemo(() => roundText(r, lang), [r, lang]);
  const rtl = lang !== 'en';

  const deal = () => {
    setPhase('dealt'); setSelected(null); setPlayed(null); setRevealed(false);
    [0, 120, 240, 360].forEach((d) => play('deal', d));
    setAnnounce(`${ui.round(round + 1)}. ${ui.place}: ${t.place.name}. ${ui.person}: ${t.person.name}. ${ui.situation}: ${t.situation.title}. ${ui.barrier}: ${t.barrier.title}.`);
    setTimeout(() => handRef.current?.querySelector('button')?.focus({ preventScroll: true }), 50);
  };

  const playCard = (opt) => {
    setPlayed(opt); setPhase('result');
    setHistory((h) => [...h.filter((x) => x.round !== round), { round, opt }]);
    const best = opt.isBest;
    play('play'); play(best ? 'good' : 'meh', 260);
    setAnnounce(best ? ui.inclusive : verdictOf(opt) === 'partial' ? ui.partial : ui.stays);
    setTimeout(() => resultRef.current?.focus({ preventScroll: true }), 60);
  };

  const nextRound = () => {
    if (round === ROUNDS.length - 1) { setPhase('summary'); play('win', 150); return; }
    setRound(round + 1); setPhase('intro');
  };
  // Deal straight away after moving to the next round
  useEffect(() => { if (phase === 'intro' && round > 0) deal(); }, [round]); // eslint-disable-line react-hooks/exhaustive-deps

  const restart = () => { setHistory([]); setRound(0); setPhase('intro'); };

  return (
    <section className={`adda adda--${phase}`} lang={lang === 'en' ? 'en' : lang} dir={rtl ? 'rtl' : 'ltr'} ref={rootRef} aria-label="Access Adda, playable prototype">
      <span className="adda__trim" aria-hidden="true" />
      <header className="adda__bar">
        <div className="adda__brand">
          <strong>Access Adda</strong>
          <span>{ui.tagline}</span>
        </div>
        <ol className="adda__rounds" aria-label={ui.round(round + 1)}>
          {ROUNDS.map((_, i) => <li key={i} className={i < round || (i === round && phase === 'result') || phase === 'summary' ? 'is-done' : i === round ? 'is-now' : ''} />)}
        </ol>
        <div className="adda__controls">
          <div className="adda__langs" role="group" aria-label="Language">
            {LANGS.map(([k, label]) => <button key={k} aria-pressed={lang === k} onClick={() => setLang(k)} lang={k}>{label}</button>)}
          </div>
          <button className="adda__sound" aria-pressed={sound} onClick={() => setSound(!sound)}>{sound ? '♪' : '♪̸'} <span>{ui.sound}</span></button>
        </div>
      </header>

      <p className="sr-only" aria-live="polite">{announce}</p>

      {phase === 'intro' && round === 0 && (
        <div className="adda__intro">
          <div className="adda__deck" aria-hidden="true"><CardBack /><CardBack /><CardBack /></div>
          <p>{ui.intro}</p>
          <button className="adda__cta" onClick={deal}>{ui.deal}</button>
        </div>
      )}

      {(phase === 'dealt' || phase === 'result') && (
        <>
          <p className="adda__roundlabel">{ui.round(round + 1)}</p>
          <ul className="adda__table" key={`${round}-${lang}`}>
            <Card i={0} kind="place" label={ui.place} title={t.place.name} body={t.place.desc} img={r.placeArt} icon={ART[r.id]?.place} />
            <Card i={1} kind="person" label={ui.person} title={`${t.person.name}, ${t.person.age}`} sub={t.person.tech} body={t.person.context} img={r.personArt} icon={ART[r.id]?.person} />
            <Card i={2} kind="situation" label={ui.situation} title={t.situation.title} body={t.situation.desc} icon={ART[r.id]?.situation} />
            <Card i={3} kind="barrier" label={ui.barrier} title={t.barrier.title} body={t.barrier.desc} icon={ART[r.id]?.barrier} />
          </ul>

          {phase === 'dealt' && (
            <div className="adda__handwrap">
              <p className="adda__handlabel">{ui.hand}</p>
              {/* Select with the checkbox (or a single tap), then press Play. Double-tap plays straight away. */}
              <ul className="adda__hand" ref={handRef} role="radiogroup" aria-label={ui.hand}>
                {t.options.map((o, i) => {
                  const on = selected === o.id;
                  return (
                    <li key={o.id} style={{ '--i': i, '--n': t.options.length }}>
                      <button
                        className={`hand-card${on ? ' is-selected' : ''}`} role="radio" aria-checked={on}
                        onClick={() => { if (on) playCard(o); else { setSelected(o.id); play('select'); } }}
                      >
                        <span className="hand-card__top">
                          <span className="hand-card__id">{o.id}</span>
                          <span className="hand-card__check" aria-hidden="true">{on ? '✓' : ''}</span>
                        </span>
                        <strong>{o.title}</strong>
                        <span className="hand-card__desc">{o.desc}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="adda__playbar">
                <button className="adda__cta" disabled={!selected} onClick={() => playCard(t.options.find((o) => o.id === selected))}>
                  {selected ? `${ui.play}: ${t.options.find((o) => o.id === selected).title}` : ui.pickFirst}
                </button>
                <span className="adda__tip">{ui.tip}</span>
              </div>
            </div>
          )}

          {phase === 'result' && played && (
            <Result
              refEl={resultRef} ui={ui} t={t} played={played} revealed={revealed} onReveal={() => { setRevealed(true); play('good'); }}
              last={round === ROUNDS.length - 1} onNext={nextRound}
            />
          )}
        </>
      )}

      {phase === 'summary' && <Summary ui={ui} lang={lang} history={history} onAgain={restart} />}
    </section>
  );
}

const verdictOf = (o) => (o.isBest ? 'inclusive' : DIMS.reduce((s, d) => s + o.impactScores[d], 0) >= 2 ? 'partial' : 'stays');

export function Card({ i = 0, kind, label, title, sub, body, img, icon, still = false }) {
  return (
    <li className={`tcard tcard--${kind}${still ? ' is-still' : ''}`} style={{ '--i': i }}>
      <div className="tcard__inner">
        <div className="tcard__face">
          <span className="tcard__type">{label}</span>
          <div className="tcard__art">
            {img ? <img src={img} alt="" /> : <span className={`tcard__icon${WIDE.has(icon) ? ' tcard__icon--wide' : ''}`}>{ICONS[icon]}</span>}
          </div>
          <h4 className="tcard__title">{title}</h4>
          {sub && <p className="tcard__sub">{sub}</p>}
          <p className="tcard__body">{body}</p>
        </div>
        <CardBack />
      </div>
    </li>
  );
}

function CardBack() {
  return <div className="tcard__back" aria-hidden="true"><span>A</span></div>;
}

function Result({ refEl, ui, t, played, revealed, onReveal, last, onNext }) {
  const v = verdictOf(played);
  const best = t.options.find((o) => o.isBest);
  const showFix = played.isBest || revealed;
  return (
    <div className={`adda__result is-${v}`} ref={refEl} tabIndex={-1} aria-labelledby="adda-verdict">
      <div className="adda__played">
        <span className="hand-card hand-card--played"><span className="hand-card__id">{played.id}</span><strong>{played.title}</strong></span>
      </div>
      <div className="adda__verdict">
        <p className="adda__badge">{played.isBest ? '★ ' : ''}{ui[v]}</p>
        <h4 id="adda-verdict">{played.critique}</h4>
        <ul className="adda__scores">
          {DIMS.map((d) => (
            <li key={d}>
              <span>{ui[d]}</span>
              <span className="pips" aria-label={`${played.impactScores[d]} / 2`}>{[0, 1].map((k) => <i key={k} className={k < played.impactScores[d] ? 'on' : ''} />)}</span>
            </li>
          ))}
        </ul>
        <div className="adda__ba">
          <div><p className="adda__k">{ui.before}</p><p>{t.before}</p></div>
          {showFix && <div className="is-after"><p className="adda__k">{ui.after}</p><p>{t.after}</p></div>}
        </div>
        {!showFix && <button className="adda__ghost" onClick={onReveal}>{ui.reveal}: <strong>{best.title}</strong></button>}
        {showFix && (
          <div className="adda__principle">
            <p className="adda__k">{ui.principle}</p>
            <p><strong>{t.principle.title}.</strong> {t.principle.desc}</p>
            {t.wcag && <p className="adda__wcag" dir="ltr">{t.wcag}</p>}
          </div>
        )}
        <button className="adda__cta" onClick={onNext}>{last ? ui.finish : ui.next} <Arrow dir="right" /></button>
      </div>
    </div>
  );
}

function Summary({ ui, lang, history, onAgain }) {
  const totals = DIMS.map((d) => {
    const got = history.reduce((s, h) => s + h.opt.impactScores[d], 0);
    const max = ROUNDS.reduce((s, r) => s + r.en.options.find((o) => o.isBest).impactScores[d], 0);
    return { d, got, max };
  });
  const pct = totals.reduce((s, x) => s + x.got, 0) / totals.reduce((s, x) => s + x.max, 0);
  const rank = ui.ranks[pct >= 0.85 ? 2 : pct >= 0.55 ? 1 : 0];
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, []);
  return (
    <div className="adda__summary" ref={ref} tabIndex={-1}>
      <div className="adda__trophy" aria-hidden="true"><CardBack /></div>
      <div>
        <p className="adda__k">{ui.impact}</p>
        <h4>{rank}</h4>
        <ul className="adda__totals">
          {totals.map((x) => (
            <li key={x.d}>
              <span>{ui[x.d]}</span>
              <span className="bar"><i style={{ width: `${(x.got / x.max) * 100}%` }} /></span>
              <b dir="ltr">{x.got}/{x.max}</b>
            </li>
          ))}
        </ul>
        <ul className="adda__learned">
          {history.map((h) => <li key={h.round}>{roundText(ROUNDS[h.round], lang).principle.title}</li>)}
        </ul>
        <button className="adda__cta" onClick={onAgain}>{ui.again} ↺</button>
      </div>
    </div>
  );
}
