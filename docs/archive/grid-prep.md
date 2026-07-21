We have a React Native iOS app rendering an isometric tilemap with @shopify/react-native-skia.
Implement the data model needed for placing characters on tiles.

Requirements:
- TypeScript types:
  - TileCoord { i:number; j:number; k:number }
  - TileMeta { walkable:boolean; placeable:boolean; height:number }
  - MapData { width;height; ground:number[][]; meta:TileMeta[][] }
  - Entity { id:string; kind:'character'; tile:TileCoord; spriteId:string }
- Implement an occupancy structure:
  - function key(i,j,k): string
  - Map<string, string> occupancyKeyToEntityId
  - helpers: isOccupied(tile, ignoreEntityId?), occupy(tile, entityId), clear(tile)
- Provide validation:
  - isTileInBounds(map, tile)
  - isTilePlaceable(map, tile)
  - canPlaceEntity(map, occupancy, entity, targetTile) -> { ok:boolean; reason?:string }
Return code as:
1) types.ts
2) occupancy.ts
3) placementRules.ts
