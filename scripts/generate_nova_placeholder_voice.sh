#!/bin/zsh
set -euo pipefail

voice="Samantha"
out="/Users/adonyflorencio/gymtwin-ai/public/audio/coaches/nova"
tmp="/Users/adonyflorencio/gymtwin-ai/tmp/nova-aiff"

mkdir -p "$out" "$tmp"

generate_line() {
  local name="$1"
  local text="$2"
  /usr/bin/say -v "$voice" -o "$tmp/$name.aiff" "$text"
  /usr/bin/afconvert -f WAVE -d LEI16 "$tmp/$name.aiff" "$out/$name.wav"
}

generate_line "session_start" "We're up. Let's get into it."
generate_line "resume_workout" "Back in. Pick up where you left off."
generate_line "rest_start" "Take a breath. We go again in a second."
generate_line "next_movement" "Next up. Set yourself and move well."
generate_line "session_complete" "Nice work. Session done. Recover well."
generate_line "safety_stop" "Stop there. Reset first."
generate_line "difficulty_easier" "Good call. Let's nudge the challenge up."
generate_line "difficulty_harder" "Good adjustment. Let's clean it up and keep moving."
generate_line "rep_5" "Five good reps."
generate_line "rep_10" "Ten in. Keep it smooth."
generate_line "form_shallow" "A little deeper."
generate_line "form_unstable" "Slow it down. Stay in control."

echo "Nova placeholder wav pack written to $out"
