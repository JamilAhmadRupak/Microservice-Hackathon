const { Pledge, PLEDGE_STATES } = require('../src/models/Pledge');

describe('Pledge State Machine Tests', () => {
  let pledge;

  beforeEach(() => {
    pledge = {
      state: PLEDGE_STATES.PENDING,
      stateHistory: [],
      canTransitionTo: function(newState) {
        const STATE_TRANSITIONS = {
          PENDING: ['AUTHORIZED', 'FAILED'],
          AUTHORIZED: ['CAPTURED', 'FAILED'],
          CAPTURED: ['COMPLETED', 'FAILED', 'REFUNDED'],
          COMPLETED: ['REFUNDED'],
          FAILED: [],
          REFUNDED: []
        };
        const allowedStates = STATE_TRANSITIONS[this.state] || [];
        return allowedStates.includes(newState);
      },
      transitionTo: function(newState, metadata = {}) {
        if (!this.canTransitionTo(newState)) {
          throw new Error(`Invalid state transition from ${this.state} to ${newState}`);
        }
        this.stateHistory.push({ state: this.state, timestamp: new Date(), metadata });
        this.state = newState;
      }
    };
  });

  it('should allow PENDING to AUTHORIZED transition', () => {
    expect(() => pledge.transitionTo(PLEDGE_STATES.AUTHORIZED)).not.toThrow();
    expect(pledge.state).toBe(PLEDGE_STATES.AUTHORIZED);
  });

  it('should allow AUTHORIZED to CAPTURED transition', () => {
    pledge.transitionTo(PLEDGE_STATES.AUTHORIZED);
    expect(() => pledge.transitionTo(PLEDGE_STATES.CAPTURED)).not.toThrow();
    expect(pledge.state).toBe(PLEDGE_STATES.CAPTURED);
  });

  it('should prevent backward transition from CAPTURED to AUTHORIZED', () => {
    pledge.transitionTo(PLEDGE_STATES.AUTHORIZED);
    pledge.transitionTo(PLEDGE_STATES.CAPTURED);
    
    expect(() => pledge.transitionTo(PLEDGE_STATES.AUTHORIZED)).toThrow();
  });

  it('should prevent invalid transition from PENDING to COMPLETED', () => {
    expect(() => pledge.transitionTo(PLEDGE_STATES.COMPLETED)).toThrow();
  });

  it('should maintain state history', () => {
    pledge.transitionTo(PLEDGE_STATES.AUTHORIZED);
    pledge.transitionTo(PLEDGE_STATES.CAPTURED);
    
    expect(pledge.stateHistory.length).toBe(2);
    expect(pledge.stateHistory[0].state).toBe(PLEDGE_STATES.PENDING);
    expect(pledge.stateHistory[1].state).toBe(PLEDGE_STATES.AUTHORIZED);
  });
});
