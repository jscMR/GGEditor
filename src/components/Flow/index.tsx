import React from 'react';
import pick from 'lodash/pick';
import G6 from '@antv/g6';
import { uuid } from '@utils';
import { FLOW_CONTAINER_ID, ShapeClassName, GraphType, LabelState } from '@common/constants';
import { GraphEvent, GraphReactEventProps } from '@common/interface';
import { withEditorPrivateContext } from '@common/context/EditorPrivateContext';
import behaviorManager from '@common/behaviorManager';
import Graph from '@components/Graph';

import './shape';
import './behavior';

interface FlowProps extends GraphReactEventProps {
  className?: string;
  style?: React.CSSProperties;
  data: any;
  customModes?: (mode: string, behaviors: any) => object;
}

interface FlowState {}

class Flow extends React.Component<FlowProps, FlowState> {
  containerId: string;

  constructor(props: FlowProps) {
    super(props);

    this.containerId = `${FLOW_CONTAINER_ID}_${uuid()}`;
  }

  canDragCanvas = () => {
    const { labelState } = this.props;

    return labelState === LabelState.Hide;
  };

  canZoomCanvas = () => {
    const { labelState } = this.props;

    return labelState === LabelState.Hide;
  };

  canDragNode = ({ target }: GraphEvent) => {
    return target && target.get('className') !== ShapeClassName.Anchor;
  };

  parseData = data => {
    const { nodes, edges } = data;

    [...nodes, ...edges].forEach(item => {
      const { id } = item;

      if (id) {
        return;
      }

      item.id = uuid();
    });
  };

  initGraph = (width: number, height: number) => {
    const { containerId } = this;
    const { customModes } = this.props;

    const customBehaviors: any = {};

    Object.keys(behaviorManager.behaviors).forEach(name => {
      const behavior = behaviorManager.behaviors[name];

      if (!behavior.graphType || behavior.graphType === GraphType.Flow) {
        customBehaviors[name] = name;
      }
    });

    const modes: any = {
      default: {
        ...customBehaviors,
        'flow-drag-canvas': {
          type: 'flow-drag-canvas',
          shouldBegin: this.canDragCanvas,
          shouldUpdate: this.canDragCanvas,
          shouldEnd: this.canDragCanvas,
        },
        'zoom-canvas': {
          type: 'zoom-canvas',
          shouldUpdate: this.canZoomCanvas,
        },
      },
    };

    Object.keys(modes).forEach(mode => {
      const behaviors = modes[mode];

      modes[mode] = Object.values(customModes ? customModes(mode, behaviors) : behaviors);
    });

    this.graph = new G6.Graph({
      container: containerId,
      width,
      height,
      modes,
    });

    return this.graph;
  };

  render() {
    const { containerId, parseData, initGraph } = this;
    const { data } = this.props;

    return (
      <Graph
        containerId={containerId}
        data={data}
        parseData={parseData}
        initGraph={initGraph}
        {...pick(this.props, ['className', 'style'])}
      />
    );
  }
}

export default withEditorPrivateContext<FlowProps>(Flow);
