export interface IDataFlowClass {
  renderStatus: 'loading' | 'notAuth' | 'ready';
  deauthFetch(): void;
  reset(): void;
}

