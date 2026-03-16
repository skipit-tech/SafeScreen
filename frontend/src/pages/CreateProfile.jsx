import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sendProfileChatMessage, createProfile, getProfile, updateProfile } from '../api/client';
import './CreateProfile.css';

const SENSITIVITY_FIELDS = [
  { key: 'violence',        label: 'Violence',         icon: '⚔️', description: 'Fighting, combat, physical harm' },
  { key: 'blood_gore',      label: 'Blood / Gore',     icon: '🩸', description: 'Blood, injuries, graphic wounds' },
  { key: 'self_harm',       label: 'Self-Harm',        icon: '🩹', description: 'Self-injury themes or depictions' },
  { key: 'suicide',         label: 'Suicide',          icon: '⚠️', description: 'Suicide themes or references' },
  { key: 'gun_weapon',      label: 'Gun / Weapon',     icon: '🔫', description: 'Firearms, weapons, threats' },
  { key: 'abuse',           label: 'Abuse',            icon: '🚫', description: 'Physical, emotional, or verbal abuse' },
  { key: 'death_grief',     label: 'Death / Grief',    icon: '🕊️', description: 'Death of characters, mourning scenes' },
  { key: 'sexual_content',  label: 'Sexual Content',   icon: '🔞', description: 'Romantic or sexual situations' },
  { key: 'bullying',        label: 'Bullying',         icon: '😤', description: 'Harassment, intimidation, exclusion' },
  { key: 'substance_use',   label: 'Substance Use',    icon: '💊', description: 'Drugs, alcohol, addiction themes' },
  { key: 'flash_seizure',   label: 'Flash / Seizure',  icon: '⚡', description: 'Strobe lights, rapid flashing' },
  { key: 'loud_sensory',    label: 'Loud / Sensory',   icon: '🔊', description: 'Loud noises, overwhelming audio' },
];

const SENSITIVITY_SCALE = [
  { value: 1, label: 'Very comfortable', emoji: '😊', color: 'safe' },
  { value: 2, label: 'Mostly okay', emoji: '🙂', color: 'mild' },
  { value: 3, label: 'Depends', emoji: '😐', color: 'moderate' },
  { value: 4, label: 'Sensitive', emoji: '😟', color: 'sensitive' },
  { value: 5, label: 'Very sensitive', emoji: '😰', color: 'intense' },
];

const defaultSensitivities = Object.fromEntries(SENSITIVITY_FIELDS.map((f) => [f.key, 3]));

// ─── Sensitivity Slider Component ────────────────────────────────────────────

function SensitivitySlider({ field, value, onChange }) {
  const scale = SENSITIVITY_SCALE[value - 1];
  
  return (
    <div className="sensitivity-card">
      <div className="sensitivity-header">
        <span className="sensitivity-icon">{field.icon}</span>
        <div className="sensitivity-info">
          <span className="sensitivity-label">{field.label}</span>
          <span className="sensitivity-desc">{field.description}</span>
        </div>
      </div>
      
      <div className="sensitivity-control">
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className={`sensitivity-range color-${scale.color}`}
        />
        <div className="sensitivity-scale-labels">
          {SENSITIVITY_SCALE.map((s) => (
            <span 
              key={s.value} 
              className={`scale-dot ${value === s.value ? 'active' : ''}`}
              onClick={() => onChange(s.value)}
            >
              {s.emoji}
            </span>
          ))}
        </div>
        <div className={`sensitivity-value color-${scale.color}`}>
          <span className="value-emoji">{scale.emoji}</span>
          <span className="value-label">{scale.label}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Form ───────────────────────────────────────────────────────────────

function EditProfileForm({ profileId }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sensitivities, setSensitivities] = useState(defaultSensitivities);
  const [calmingStrategy, setCalmingStrategy] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile(profileId).then((res) => {
      const p = res.data;
      setName(p.name);
      setAge(String(p.age));
      setSensitivities({ ...defaultSensitivities, ...p.sensitivities });
      setCalmingStrategy(p.calming_strategy || '');
      setAdditionalDetails(p.additional_details || {});
      setLoading(false);
    }).catch(() => navigate('/'));
  }, [profileId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profileId, {
        name,
        age: parseInt(age),
        sensitivities,
        calming_strategy: calmingStrategy,
        additional_details: additionalDetails,
      });
      navigate('/');
    } catch (err) {
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <header className="profile-header">
          <h1>Edit Profile</h1>
          <p className="profile-subtitle">
            Adjust sensitivity settings to personalize the viewing experience.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="profile-form">
          {/* Basic Info Card */}
          <section className="profile-section">
            <div className="section-header">
              <h2>Basic Info</h2>
            </div>
            <div className="section-content">
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="name">Name</label>
                  <input
                    id="name"
                    type="text"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                    placeholder="Who is this profile for?"
                  />
                </div>
                <div className="form-field form-field-small">
                  <label htmlFor="age">Age</label>
                  <input
                    id="age"
                    type="number"
                    className="input"
                    min={1}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Sensitivities Card */}
          <section className="profile-section">
            <div className="section-header">
              <h2>Sensitivities</h2>
              <p className="section-hint">
                This helps Skipit decide whether to warn, soften, or skip certain scenes.
              </p>
            </div>
            
            <div className="scale-legend">
              {SENSITIVITY_SCALE.map((s) => (
                <div key={s.value} className={`legend-item color-${s.color}`}>
                  <span className="legend-emoji">{s.emoji}</span>
                  <span className="legend-label">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="sensitivities-grid">
              {SENSITIVITY_FIELDS.map((field) => (
                <SensitivitySlider
                  key={field.key}
                  field={field}
                  value={sensitivities[field.key]}
                  onChange={(val) => setSensitivities(prev => ({ ...prev, [field.key]: val }))}
                />
              ))}
            </div>
          </section>

          {/* Calming Strategy Card */}
          <section className="profile-section">
            <div className="section-header">
              <h2>Calming Strategy</h2>
              <p className="section-hint">
                What helps when something unexpected comes up?
              </p>
            </div>
            <div className="section-content">
              <textarea
                className="input textarea"
                value={calmingStrategy}
                onChange={(e) => setCalmingStrategy(e.target.value)}
                placeholder="e.g., Deep breathing, looking at calming images, taking a short break..."
                maxLength={500}
                rows={3}
              />
            </div>
          </section>

          {/* Actions */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !name.trim() || !age}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Create Chat ──────────────────────────────────────────────────────────────

function CreateProfileChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chatComplete, setChatComplete] = useState(false);
  const [finalProfile, setFinalProfile] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const initChat = async () => {
      setLoading(true);
      try {
        const res = await sendProfileChatMessage([]);
        setMessages([{ role: 'assistant', content: res.data.reply }]);
      } catch {
        setMessages([{ role: 'assistant', content: "I'm having trouble connecting right now. Please check your connection and try again." }]);
      } finally {
        setLoading(false);
      }
    };
    initChat();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading || chatComplete) return;

    const newMessages = [...messages, { role: 'user', content: inputText.trim() }];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);

    try {
      const res = await sendProfileChatMessage(newMessages);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
      if (res.data.is_complete && res.data.profile_data) {
        setChatComplete(true);
        setFinalProfile(res.data.profile_data);
      }
    } catch {
      setMessages((prev) => prev.slice(0, -1));
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!finalProfile) return;
    setSaving(true);
    try {
      await createProfile(finalProfile);
      navigate('/');
    } catch {
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="chat-page-container">
        <header className="profile-header">
          <h1>Create Profile</h1>
          <p className="profile-subtitle">
            Answer a few questions to help Skipit understand what works best for you.
          </p>
          <p className="profile-helper">
            You're always in control. Skip any question or change your mind later.
          </p>
        </header>

        <div className="chat-wrapper">
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="assistant-avatar">
                    <span>S</span>
                  </div>
                )}
                <div className="message-bubble">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-message assistant">
                <div className="assistant-avatar">
                  <span>S</span>
                </div>
                <div className="message-bubble typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {chatComplete ? (
            <div className="chat-complete-card">
              <div className="complete-icon">✓</div>
              <h3>Profile Ready</h3>
              <p>We've captured your preferences. You can always adjust these later in settings.</p>
              <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          ) : (
            <form className="chat-input-form" onSubmit={handleSend}>
              <input
                type="text"
                className="chat-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your response..."
                disabled={loading}
                autoFocus
              />
              <button type="submit" className="btn btn-primary send-btn" disabled={!inputText.trim() || loading}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          )}
        </div>

        {!chatComplete && (
          <div className="chat-footer">
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root export ─────────────────────────────────────────────────────────────

export default function CreateProfile() {
  const { id } = useParams();
  return id ? <EditProfileForm profileId={id} /> : <CreateProfileChat />;
}
