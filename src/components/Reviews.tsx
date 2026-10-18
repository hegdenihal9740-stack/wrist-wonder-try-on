import { useCallback, useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { BadgeCheck, Star } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Review = { id: string; author: string; rating: number; comment: string; verified: boolean; created_at: string };

export function Reviews({ tone, rating, total }: { tone: string; rating: number; total: number }) {
  const [list, setList] = useState<Review[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [stars, setStars] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const { data } = await supabase.from('reviews').select('id,author,rating,comment,verified,created_at').eq('product_id', tone).order('created_at', { ascending: false }).limit(20);
    setList(data ?? []);
  }, [tone]);
  useEffect(() => { void load(); void supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user)); }, [load]);

  const submit = async () => {
    if (text.trim().length < 3) { toast.error('Please write a few words'); return; }
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const meta = u.user?.user_metadata ?? {};
    const author = String(meta['display_name'] ?? meta['full_name'] ?? u.user?.email?.split('@')[0] ?? 'Customer').slice(0, 60);
    const { error } = await supabase.from('reviews').insert({ product_id: tone, author, rating: stars, comment: text.trim().slice(0, 1000) });
    setBusy(false);
    if (error) { toast.error(/duplicate/i.test(error.message) ? 'You already reviewed this watch' : 'Could not post review'); return; }
    setText(''); toast.success('Thanks for your review!'); void load();
  };

  const bars = [5, 4, 3, 2, 1].map((s) => ({ s, pct: s === 5 ? 62 : s === 4 ? 24 : s === 3 ? 8 : s === 2 ? 4 : 2 }));
  return <div className="fk-section rv">
    <h4>Ratings &amp; reviews</h4>
    <div className="rv-summary">
      <div className="rv-big"><b>{rating}</b><Star size={18} fill="currentColor" /><span className="fk-muted">{total.toLocaleString('en-IN')} ratings</span></div>
      <div className="rv-bars">{bars.map((b) => <div key={b.s}><span>{b.s}★</span><i><em style={{ width: `${b.pct}%` }} /></i></div>)}</div>
    </div>
    {signedIn ? <div className="rv-form">
      <div className="rv-stars" role="radiogroup" aria-label="Your rating">{[1, 2, 3, 4, 5].map((s) => <button key={s} type="button" role="radio" aria-checked={stars === s} aria-label={`${s} stars`} onClick={() => setStars(s)}><Star size={22} fill={s <= stars ? 'currentColor' : 'none'} /></button>)}</div>
      <textarea className="shop-input" rows={3} maxLength={1000} placeholder="How does it look and feel?" value={text} onChange={(e) => setText(e.target.value)} />
      <button type="button" className="fk-cart" disabled={busy} onClick={() => void submit()}>{busy ? 'Posting…' : 'Post review'}</button>
    </div> : <p className="fk-muted"><Link to="/auth">Sign in</Link> to write a review.</p>}
    <ul className="rv-list">
      {list.map((r) => <li key={r.id}>
        <p><span className="fk-rating-chip">{r.rating} <Star size={10} fill="currentColor" /></span> <b>{r.author}</b>{r.verified && <span className="rv-ver"><BadgeCheck size={13} /> Verified buyer</span>}</p>
        <p>{r.comment}</p>
        <p className="fk-muted rv-date">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
      </li>)}
      {!list.length && <li className="fk-muted">No written reviews yet — be the first.</li>}
    </ul>
  </div>;
}
