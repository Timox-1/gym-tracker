function isIndexSaved(
  i: number,
  idx: number,
  saved: ReadonlySet<number> | Record<number, unknown>,
): boolean {
  if (i === idx) return true
  if (saved instanceof Set) {
    return saved.has(i)
  }
  if (typeof (saved as ReadonlySet<number>).has === 'function') {
    return (saved as ReadonlySet<number>).has(i)
  }
  return Object.prototype.hasOwnProperty.call(saved, i)
}

function isSavedEmpty(saved: ReadonlySet<number> | Record<number, unknown>): boolean {
  if (saved instanceof Set) {
    return saved.size === 0
  }
  if (typeof (saved as ReadonlySet<number>).has === 'function') {
    return (saved as ReadonlySet<number>).size === 0
  }
  return Object.keys(saved).length === 0
}

export function nextIndex(
  planLength: number,
  idx: number,
  block: { start: number; end: number },
  saved: ReadonlySet<number> | Record<number, unknown>,
): number | null {
  if (idx === planLength - 1 && isSavedEmpty(saved)) {
    return null
  }

  for (let i = idx + 1; i < block.end; i++) {
    if (!isIndexSaved(i, idx, saved)) {
      return i
    }
  }

  for (let i = 0; i < planLength; i++) {
    if (i === idx) continue
    if (!isIndexSaved(i, idx, saved)) {
      return i
    }
  }

  return null
}
