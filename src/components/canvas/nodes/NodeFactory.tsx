import React from 'react'
import { UINode } from '../../../types/canvas'
import { TextNode } from './TextNode'
import { ImageNode } from './ImageNode'
import { HTMLNode } from './HTMLNode'
import { FolderNode } from './FolderNode'

interface NodeFactoryProps {
  node: UINode
}

export const NodeFactory: React.FC<NodeFactoryProps> = ({ node }) => {
  switch (node.type) {
    case 'text':
      return <TextNode node={node} />
    case 'image':
      return <ImageNode node={node} />
    case 'html':
      return <HTMLNode node={node} />
    case 'folder':
      return <FolderNode node={node} />
    default:
      return null
  }
}
