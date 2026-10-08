import type { TranscriptLine } from '../../types/api'

interface SpeakerLineProps {
  line: TranscriptLine
}

function formatTimestamp(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60,
  ).padStart(2, '0')}`
}

export function SpeakerLine({ line }: SpeakerLineProps) {
  const speakerClass = line.speaker.toLowerCase()

  return (
    <article className={`transcript-line speaker-${speakerClass}`}>
      <span className={`speaker ${speakerClass}`}>{line.speaker}</span>
      <p>{line.text}</p>
      <time dateTime={`PT${line.start_ms / 1000}S`}>
        {formatTimestamp(line.start_ms)}
      </time>
      <span
        className="transcript-confidence"
        aria-label={`Confidence ${Math.round(line.confidence * 100)} percent`}
      >
        {Math.round(line.confidence * 100)}%
      </span>
    </article>
  )
}