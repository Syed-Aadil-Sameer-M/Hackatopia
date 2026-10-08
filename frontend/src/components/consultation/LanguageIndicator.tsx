import type { LanguageDetected } from '../../types/api'

const languageNames: Record<string, string> = {
  'kn-en': 'Kannada-English',
  kn: 'Kannada',
  en: 'English',
}

interface LanguageIndicatorProps {
  language: LanguageDetected | null
}

export function LanguageIndicator({ language }: LanguageIndicatorProps) {
  const name = language ? languageNames[language] ?? language : 'Detecting...'

  return (
    <span className="language-pill" aria-label={`Detected language: ${name}`}>
      {name}
      {language && <span className="language-code"> · {language}</span>}
    </span>
  )
}