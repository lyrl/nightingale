import React, { Component } from 'react';
import { Switch, Popover, Input, Button, Card, Spin } from 'antd';
import _ from 'lodash';
import Multipicker from '@cpts/Multipicker';
import { util as graphUtil } from '@cpts/Graph';
import { prefixCls } from './config';
import { GraphData, Hosts, DynamicHostsType } from './interface';

interface Props {
  loading: boolean,
  hosts: Hosts,
  selectedHosts: Hosts,
  graphConfigs: GraphData[],
  updateGraph: (graphConfigs: GraphData[]) => void,
  onSelectedHostsChange: (hosts: Hosts, selectedHosts: Hosts) => void,
}

interface State {
  dynamicSwitch: boolean,
  reloadBtnVisible: boolean,
}


export default class HostSelect extends Component<Props, State> {
  static defaultProps = {
    hosts: [],
    selectedHosts: [],
    graphConfigs: [],
    updateGraph: () => {},
    onSelectedHostsChange: () => {},
  };

  state = {
    dynamicSwitch: false,
  } as State;

  handleSelectChange = (selected: string[]) => {
    if (graphUtil.hasDtag(selected)) {
      selected.splice(0, 1);
    }
    this.props.onSelectedHostsChange(this.props.hosts, selected);
    this.setState({ reloadBtnVisible: true });
  }

  handleDynamicSelect = (type: DynamicHostsType, val?: string) => {
    const { graphConfigs } = this.props;
    let selected = ['=all'];
    if (type === '=all') {
      selected = ['=all'];
    } else if (type === '=+') {
      selected = [`=+${val}`];
    } else if (type === '=-') {
      selected = [`=-${val}`];
    }
    this.props.onSelectedHostsChange(this.props.hosts, selected);
    if (graphConfigs.length && selected.length) {
      this.setState({ reloadBtnVisible: true });
    }
  }

  handleDynamicSwitchChange = (val: boolean) => {
    this.setState({ dynamicSwitch: val });
  }

  handleReloadBtnClick = () => {
    this.setState({
      reloadBtnVisible: false,
    });
    const { graphConfigs, updateGraph, selectedHosts } = this.props;
    const graphConfigsClone = _.cloneDeep(graphConfigs);
    _.each(graphConfigsClone, (item) => {
      _.each(item.metrics, (metricObj) => {
        const { selectedTagkv } = metricObj;
        const newSelectedTagkv = _.map(selectedTagkv, (tagItem) => {
          if (tagItem.tagk === 'endpoint') {
            return {
              tagk: tagItem.tagk,
              tagv: selectedHosts,
            };
          }
          return tagItem;
        });
        metricObj.selectedEndpoint = selectedHosts;
        metricObj.selectedTagkv = newSelectedTagkv;
      });
    });
    updateGraph(graphConfigsClone);
  }

  render() {
    const { selectedHosts, hosts, loading } = this.props;
    const { dynamicSwitch, reloadBtnVisible } = this.state;
    return (
      <Spin spinning={loading}>
        <Card title="机器列表" className={`${prefixCls}-card`}>
          <Multipicker
            width="100%"
            manualEntry
            data={hosts}
            selected={selectedHosts}
            onChange={this.handleSelectChange}
          />
          <div style={{ position: 'absolute', top: 12, right: 18 }}>
            {
              dynamicSwitch ?
                <span>
                  <a onClick={() => { this.handleDynamicSelect('=all'); }}>全选</a>
                  <span className="ant-divider" />
                  <Popover
                    trigger="click"
                    content={
                      <div style={{ width: 200 }}>
                        <Input
                          placeholder="请输入关键词，Enter键提交"
                          onKeyDown={(e: any) => {
                            if (e.keyCode === 13) {
                              this.handleDynamicSelect('=+', e.target.value);
                            }
                          }}
                        />
                      </div>
                    }
                    title="包含"
                  >
                    <a>包含</a>
                  </Popover>
                  <span className="ant-divider" />
                  <Popover
                    trigger="click"
                    content={
                      <div style={{ width: 200 }}>
                        <Input
                          placeholder="请输入关键词，Enter键提交"
                          onKeyDown={(e: any) => {
                            if (e.keyCode === 13) {
                              this.handleDynamicSelect('=-', e.target.value);
                            }
                          }}
                        />
                      </div>
                    }
                    title="排除"
                  >
                    <a>排除</a>
                  </Popover>
                </span> :
                <div>
                  动态值 <Switch onChange={this.handleDynamicSwitchChange} size="small" />
                </div>
            }
          </div>
          {
            reloadBtnVisible ?
              <div style={{ position: 'absolute', bottom: 3, right: 5 }}>
                <Button type="primary" onClick={this.handleReloadBtnClick}>更新图表</Button>
              </div> : null
          }
        </Card>
      </Spin>
    );
  }
}
