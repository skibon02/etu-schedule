export interface IActiveClass {
  active: 'profile' | 'schedule' | 'planning',
  profile(): void,
  schedule(): void,
  planning(): void,
  reset(): void
}

