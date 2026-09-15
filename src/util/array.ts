export const emptyArray = (length: number) => new Array<null>(length).fill(null)

/**
 * Radix toggle groups hand values back as strings — these map them back onto
 * the (possibly numeric) union they came from, dropping anything unknown.
 */
export const findLiteral = <T extends string | number>(
  literals: readonly T[],
  raw: string
): T | undefined => literals.find((literal) => String(literal) === raw)

export const findLiterals = <T extends string | number>(
  literals: readonly T[],
  raws: string[]
): T[] =>
  raws.flatMap((raw) => {
    const literal = findLiteral(literals, raw)
    return literal == null ? [] : [literal]
  })
