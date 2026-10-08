import type { Prescription } from '../../types/api'

interface PrescriptionEditorProps {
  prescriptions: Prescription[]
  disabled: boolean
  onChange: (prescriptions: Prescription[]) => void
}

const emptyPrescription: Prescription = {
  drug: '',
  dose: '',
  frequency: '',
  duration: '',
  route: '',
  instructions: '',
}

export function PrescriptionEditor({
  prescriptions,
  disabled,
  onChange,
}: PrescriptionEditorProps) {
  function updatePrescription(
    index: number,
    field: keyof Prescription,
    value: string,
  ): void {
    onChange(
      prescriptions.map((prescription, prescriptionIndex) =>
        prescriptionIndex === index
          ? { ...prescription, [field]: value }
          : prescription,
      ),
    )
  }

  return (
    <section className="note-section" aria-labelledby="prescriptions-heading">
      <div className="note-section-heading">
        <h3 id="prescriptions-heading">Prescription</h3>
        <button
          className="button button-secondary"
          disabled={disabled}
          onClick={() => onChange([...prescriptions, { ...emptyPrescription }])}
          type="button"
        >
          Add prescription
        </button>
      </div>
      {prescriptions.length === 0 ? (
        <p className="empty-state">No prescriptions in this draft.</p>
      ) : (
        prescriptions.map((prescription, index) => (
          <fieldset className="prescription-fields" disabled={disabled} key={index}>
            <legend>Prescription {index + 1}</legend>
            {(
              [
                ['drug', 'Medication'],
                ['dose', 'Dose'],
                ['frequency', 'Frequency'],
                ['duration', 'Duration'],
                ['route', 'Route'],
                ['instructions', 'Instructions'],
              ] as const
            ).map(([field, label]) => (
              <label key={field}>
                {label}
                <input
                  onChange={(event) =>
                    updatePrescription(index, field, event.target.value)
                  }
                  value={prescription[field]}
                />
              </label>
            ))}
            <button
              className="button button-secondary"
              onClick={() =>
                onChange(
                  prescriptions.filter(
                    (_, prescriptionIndex) => prescriptionIndex !== index,
                  ),
                )
              }
              type="button"
            >
              Remove prescription
            </button>
          </fieldset>
        ))
      )}
    </section>
  )
}