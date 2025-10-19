import React from 'react'
import { BaseNode, Viewport, NodeProps } from '../../../../types/canvas'
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
      return <TextNode node={node} {...nodeProps} />
    case 'media':
      return <MediaNode node={node} {...nodeProps} />
    case 'html':
      return <HTMLNode node={node} {...nodeProps} />
    case 'folder':
      return <FolderNode node={node} {...nodeProps} />
    default:
      console.warn(`Unknown node type: ${node.type}`)
      return null
  }
}

export default NodeFactory
