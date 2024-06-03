export class UnreachableCaseError extends Error {
  constructor(value: never) {
    super(`Unhandled value in switch case ${JSON.stringify(value)}`)
  }
}
