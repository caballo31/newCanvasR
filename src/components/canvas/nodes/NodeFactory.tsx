import React from 'react'
import { BaseNode, NodeProps } from '../types/canvas'
import TextNode from './TextNode'
import MediaNode from './MediaNode'
import HTMLNode from './HTMLNode'
import FolderNode from './FolderNode'

interface NodeFactoryProps extends Omit<NodeProps, 'node'> {
  node: BaseNode
}

const NodeFactory: React.FC<NodeFactoryProps> = (props) => {
  const { node, ...nodeProps } = props

  switch (node.type) {
    case 'text':
      return <TextNode {...(nodeProps as NodeProps)} node={node} />
    case 'media':
      return <MediaNode {...(nodeProps as NodeProps)} node={node} />
    case 'html':
      return <HTMLNode {...(nodeProps as NodeProps)} node={node} />
    case 'folder':
      return <FolderNode {...(nodeProps as NodeProps)} node={node} />
    default:
      console.warn(`Unknown node type: ${node.type}`)
      return null
  }
}

export default NodeFactory
