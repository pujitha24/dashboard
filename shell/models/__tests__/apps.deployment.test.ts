import Deployment from '@shell/models/apps.deployment';
import { WORKLOAD_TYPES } from '@shell/config/types';

describe('class Deployment', () => {
  describe('replicaSetId', () => {
    it.each([{
      relationships: [],
      expected:      undefined,
    }, {
      relationships: [{
        rel:    'owner',
        toType: WORKLOAD_TYPES.REPLICA_SET,
        toId:   'rel-id'
      }],
      expected: 'rel-id',
    }, {
      relationships: [{
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-1',
        message: 'ReplicaSet is available. Replicas: 1'
      }],
      expected: 'rel-id-1',
    }, {
      relationships: [{
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-1',
        message: 'ReplicaSet is available. Replicas: 0'
      }, {
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-2',
        message: 'ReplicaSet is available. Replicas: 1'
      }],
      expected: 'rel-id-2',
    }, {
      relationships: [{
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-1',
        message: 'Message without replicas count'
      }, {
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-2',
        message: 'Another message without replicas count'
      }],
      expected: 'rel-id-1',
    }, {
      relationships: [{
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-1',
        message: 'ReplicaSet is available. Replicas: 0'
      }, {
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-2',
        message: 'ReplicaSet is available. Replicas: 0'
      }],
      expected: 'rel-id-1',
    }, {
      relationships: [{
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-1',
        message: 'Message without replicas count'
      }, {
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-2',
        message: 'ReplicaSet is available. Replicas: 0'
      }],
      expected: 'rel-id-1',
    }])('replicaSetId', ({ relationships, expected }) => {
      const deploymentData = {
        id:       'any-id',
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: {
          name:      'any-name',
          namespace: 'any-namespace',
          uid:       'any-uid',
          relationships,
        },
      };

      const deployment = new Deployment(deploymentData);

      expect(deployment.replicaSetId).toStrictEqual(expected);
    });
  });

  describe('rollBack', () => {
    it('should only patch the revision annotation and keep other deployment annotations', async() => {
      const deployment = new Deployment({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: {
          name:        'any-name',
          namespace:   'any-namespace',
          annotations: { 'deployment.kubernetes.io/revision': '2', 'custom/annotation': 'value' }
        },
      });
      const revision = {
        metadata: { annotations: { 'deployment.kubernetes.io/revision': '1' } },
        spec:     { template: { metadata: { labels: { app: 'a', 'pod-template-hash': 'x' } }, spec: { containers: [] } } }
      };

      deployment.rollBackWorkload = jest.fn();

      await deployment.rollBack({ id: 'local' }, deployment, revision);

      const body = (deployment.rollBackWorkload as jest.Mock).mock.calls[0][3];

      expect(body[1]).toStrictEqual({
        op:    'replace',
        path:  '/metadata/annotations/deployment.kubernetes.io~1revision',
        value: '1'
      });
    });
  });
});
