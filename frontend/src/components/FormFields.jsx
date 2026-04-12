import HistoryInput from "./HistoryInput";
import TextAreaWithHistory from "./TextAreaWithHistory";

export default function FormFields({ form, setForm, handleFieldBlur }) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Title *</label>
        <HistoryInput
          id="yamli-item-title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          onBlur={handleFieldBlur("title")}
          placeholder="Title *"
          fieldName="title"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Edition</label>
          <HistoryInput
            id="yamli-item-edition"
            value={form.edition}
            onChange={(e) => setForm({ ...form, edition: e.target.value })}
            onBlur={handleFieldBlur("edition")}
            placeholder="e.g. 1st, 2nd"
            fieldName="edition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Publisher</label>
          <HistoryInput
            id="yamli-item-publisher_name"
            value={form.publisher_name}
            onChange={(e) => setForm({ ...form, publisher_name: e.target.value })}
            onBlur={handleFieldBlur("publisher_name")}
            placeholder="Publisher name"
            fieldName="publisher_name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
          <HistoryInput
            id="yamli-item-publish_year"
            type="number"
            value={form.publish_year}
            onChange={(e) => setForm({ ...form, publish_year: e.target.value })}
            onBlur={handleFieldBlur("publish_year")}
            placeholder="e.g. 2024"
            fieldName="publish_year"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Call No.</label>
          <HistoryInput
            id="yamli-item-call_number"
            value={form.call_number}
            onChange={(e) => setForm({ ...form, call_number: e.target.value })}
            onBlur={handleFieldBlur("call_number")}
            placeholder="Call number"
            fieldName="call_number"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Language</label>
          <HistoryInput
            id="yamli-item-language_name"
            value={form.language_name}
            onChange={(e) => setForm({ ...form, language_name: e.target.value })}
            onBlur={handleFieldBlur("language_name")}
            placeholder="e.g. Indonesian, Arabic"
            fieldName="language_name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Place</label>
          <HistoryInput
            id="yamli-item-place_name"
            value={form.place_name}
            onChange={(e) => setForm({ ...form, place_name: e.target.value })}
            onBlur={handleFieldBlur("place_name")}
            placeholder="Place of publication"
            fieldName="place_name"
          />
        </div>
      </div>

      {/* Classification */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Classification</label>
        <HistoryInput
          id="yamli-item-classification"
          value={form.classification}
          onChange={(e) => setForm({ ...form, classification: e.target.value })}
          onBlur={handleFieldBlur("classification")}
          placeholder="e.g. Dewey decimal"
          fieldName="classification"
        />
      </div>

      {/* Authors */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Authors</label>
        <HistoryInput
          id="yamli-item-authors"
          value={form.authors}
          onChange={(e) => setForm({ ...form, authors: e.target.value })}
          onBlur={handleFieldBlur("authors")}
          placeholder="Author(s), comma-separated"
          fieldName="authors"
        />
      </div>

      {/* Topics */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Topics</label>
        <HistoryInput
          id="yamli-item-topics"
          value={form.topics}
          onChange={(e) => setForm({ ...form, topics: e.target.value })}
          onBlur={handleFieldBlur("topics")}
          placeholder="Topic(s), comma-separated"
          fieldName="topics"
        />
      </div>

      {/* Volume */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Volume</label>
        <HistoryInput
          id="yamli-item-volume"
          value={form.volume}
          onChange={(e) => setForm({ ...form, volume: e.target.value })}
          onBlur={handleFieldBlur("volume")}
          placeholder="Volume / edition"
          fieldName="volume"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
        <TextAreaWithHistory
          id="yamli-item-description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          onBlur={handleFieldBlur("description")}
          placeholder="Optional description"
          fieldName="description"
        />
      </div>

      {/* Extra Info */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Extra Info</label>
        <TextAreaWithHistory
          id="yamli-item-extra_info"
          value={form.extra_info}
          onChange={(e) => setForm({ ...form, extra_info: e.target.value })}
          onBlur={handleFieldBlur("extra_info")}
          placeholder="Extra info (optional)"
          fieldName="extra_info"
        />
      </div>
    </div>
  );
}
