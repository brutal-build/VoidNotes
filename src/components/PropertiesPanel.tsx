import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { parseProperties, serializeProperties, validateValue, detectType, DEFAULT_PROPERTIES, PropType } from '../plugins/properties';

interface PropertiesPanelProps {
  rawContent: string;
  onSave: (newContent: string) => void;
}

// ─── Sub-component for tags field (hooks must be at top level) ───

function TagsField({ value, onChange }: { value: string[], onChange: (v: string[]) => void }) {
  const [inputVal, setInputVal] = useState('');

  const addTag = () => {
    const tag = inputVal.trim().toLowerCase();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setInputVal('');
  };

  return (
    <div className="prop-tags-wrap">
      <div className="prop-tags-list">
        {value.map(tag => (
          <span key={tag} className="prop-tag-chip">
            #{tag}
            <button className="prop-tag-remove" onClick={() => onChange(value.filter(t => t !== tag))}>&times;</button>
          </span>
        ))}
      </div>
      <div className="prop-tags-add">
        <input className="prop-input prop-tag-input" type="text" placeholder="Add tag..." value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
        <button className="prop-tag-add-btn" onClick={addTag}>+</button>
      </div>
    </div>
  );
}

// ─── Main component ───

export default function PropertiesPanel({ rawContent, onSave }: PropertiesPanelProps) {
  const parsed = useMemo(() => parseProperties(rawContent), [rawContent]);
  const [addingField, setAddingField] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newType, setNewType] = useState<PropType>('string');
  const [saveError, setSaveError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<string | null>(null);

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (pendingRef.current) onSave(pendingRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const titleValue = (parsed.data.title as string) || '';

  const entries = useMemo(() => {
    const keys = new Set([...DEFAULT_PROPERTIES.map(p => p.key), ...Object.keys(parsed.data)]);
    return Array.from(keys).filter(k => k !== 'title').sort();
  }, [parsed.data]);

  const flushSave = useCallback((content: string) => {
    pendingRef.current = content;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSave(content);
      pendingRef.current = null;
    }, 300);
  }, [onSave]);

  const handleChange = useCallback((key: string, rawValue: unknown, type?: PropType) => {
    if (parsed.error) return;
    const t = type || detectType(parsed.data[key]);
    const validated = validateValue(rawValue, t);
    try {
      const updated = serializeProperties(parsed.content, { ...parsed.data, [key]: validated });
      flushSave(updated);
      setSaveError('');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save properties');
    }
  }, [parsed, flushSave]);

  const handleRemove = useCallback((key: string) => {
    if (parsed.error) return;
    const { [key]: _, ...rest } = parsed.data;
    onSave(serializeProperties(parsed.content, rest));
  }, [parsed, onSave]);

  const handleAddField = useCallback(() => {
    if (!newKey.trim()) return;
    const key = newKey.trim();
    handleChange(key, '', newType);
    setNewKey('');
    setAddingField(false);
  }, [newKey, newType, handleChange]);

  const getTypeFor = (key: string): PropType => {
    const def = DEFAULT_PROPERTIES.find(p => p.key === key);
    if (def) return def.type;
    return parsed.data[key] !== undefined ? detectType(parsed.data[key]) : 'string';
  };

  const renderField = (key: string) => {
    const type = getTypeFor(key);
    const value = parsed.data[key];

    switch (type) {
      case 'string':
        return <input className="prop-input" type="text" value={String(value ?? '')} onChange={e => handleChange(key, e.target.value, 'string')} />;

      case 'number':
        return <input className="prop-input" type="number" value={value !== undefined ? String(value) : '0'} onChange={e => handleChange(key, e.target.value, 'number')} />;

      case 'boolean':
        return (
          <label className="prop-checkbox-wrap">
            <input type="checkbox" checked={value === true || value === 'true'} onChange={e => handleChange(key, e.target.checked, 'boolean')} />
            <span>{key}</span>
          </label>
        );

      case 'date':
        return <input className="prop-input" type="date" value={String(value ?? '')} onChange={e => handleChange(key, e.target.value, 'date')} />;

      case 'tags': {
        const tags = Array.isArray(value) ? value.map(String) : [];
        return (
          <TagsField value={tags} onChange={(newTags) => handleChange(key, newTags, 'tags')} />
        );
      }

      default:
        return <input className="prop-input" type="text" value={String(value ?? '')} onChange={e => handleChange(key, e.target.value)} />;
    }
  };

  return (
    <div className="properties-panel">
      {(parsed.error || saveError) && <div role="alert">Invalid frontmatter: {parsed.error || saveError}</div>}
      <div className="prop-field prop-title-field">
        <input className="prop-title-input" type="text" placeholder="Note title..." value={titleValue}
          onChange={e => handleChange('title', e.target.value, 'string')} />
      </div>

      <div className="prop-fields">
        {entries.map(key => {
          const isDefault = DEFAULT_PROPERTIES.some(p => p.key === key);
          return (
            <div key={key} className="prop-field">
              <div className="prop-label-row">
                <span className="prop-label">{key}</span>
                <span className="prop-type-tag">{getTypeFor(key)}</span>
                {!isDefault && (
                  <button className="prop-remove-btn" onClick={() => handleRemove(key)} title="Remove property">&times;</button>
                )}
              </div>
              <div className="prop-input-wrap">{renderField(key)}</div>
            </div>
          );
        })}
      </div>

      <div className="prop-add-section">
        {addingField ? (
          <div className="prop-add-form">
            <input className="prop-input" type="text" placeholder="Property name..." value={newKey}
              onChange={e => setNewKey(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddField(); if (e.key === 'Escape') setAddingField(false); }} autoFocus />
            <select className="prop-type-select" value={newType} onChange={e => setNewType(e.target.value as PropType)}>
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
              <option value="date">date</option>
              <option value="tags">tags</option>
            </select>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="prop-add-btn" onClick={handleAddField}>Add</button>
              <button className="prop-cancel-btn" onClick={() => setAddingField(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="prop-add-field-btn" onClick={() => setAddingField(true)}>+ Add property</button>
        )}
      </div>
    </div>
  );
}
