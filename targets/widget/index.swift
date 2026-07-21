import WidgetKit
import SwiftUI
import UIKit
import AppIntents

// MARK: - Shared constants

let APP_GROUP = "group.com.rooted.app"
let WILT_THRESHOLD = 30.0

// MARK: - Design tokens (mirrors src/constants/theme.ts + ratified dark variants)

enum Tokens {
  static let surface = dynamic(light: 0xF5E6D3, dark: 0x2E2416)
  static let ink = dynamic(light: 0x4A301F, dark: 0xF0E4CC)
  static let inkSoft = dynamic(light: 0x6B4423, dark: 0xE3CFA9)
  static let inkMuted = dynamic(light: 0xA0826D, dark: 0xA98D63)
  static let accent = dynamic(light: 0x2D5016, dark: 0xA9C495)
  static let wood = dynamic(light: 0x8B6F47, dark: 0x7A5F3D)
  static let track = dynamic(light: 0xDEB887, dark: 0x4E3A22)
  static let chip = dynamic(light: 0xEDE0C5, dark: 0x382C1B)
  static let ok = Color(rgb: 0x4CAF50)
  static let warn = Color(rgb: 0xFFC107)
  static let low = Color(rgb: 0xF44336)

  static func ramp(_ pct: Double) -> Color {
    if pct >= 60 { return ok }
    if pct >= 20 { return warn }
    return low
  }

  static func dynamic(light: UInt32, dark: UInt32) -> Color {
    Color(UIColor { trait in
      trait.userInterfaceStyle == .dark ? UIColor(rgb: dark) : UIColor(rgb: light)
    })
  }
}

extension UIColor {
  convenience init(rgb: UInt32) {
    self.init(
      red: CGFloat((rgb >> 16) & 0xFF) / 255,
      green: CGFloat((rgb >> 8) & 0xFF) / 255,
      blue: CGFloat(rgb & 0xFF) / 255,
      alpha: 1
    )
  }
}

extension Color {
  init(rgb: UInt32) { self.init(UIColor(rgb: rgb)) }
}

func pixelFont(_ size: CGFloat) -> Font {
  .custom("VT323-Regular", size: size)
}

// MARK: - Snapshot model (written by src/lib/widgetSync.ts via ExtensionStorage)

struct GardenPlant: Identifiable {
  let id: String
  let name: String
  let plantType: String
  /// Effective hydration at `syncedAt` (the app already applied decay at load).
  let hydration: Double
  let decayRatePerDay: Double
  let lastContactAt: Date?
  /// Display label, e.g. "weekly" (lowercased from the app's contactFrequency).
  let frequency: String

  var spriteName: String {
    switch plantType {
    case "cactus", "sunflower", "monstera", "ficus": return plantType
    default: return "cactus" // same fallback as plantCatalog.resolvePlantByType
    }
  }
}

/// ExtensionStorage.setArray stores arrays as JSON-encoded Data, not a plist
/// array — decode accordingly.
func loadGardenRows(_ defaults: UserDefaults?) -> [[String: Any]] {
  guard let data = defaults?.data(forKey: "garden"),
        let rows = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]]
  else { return [] }
  return rows
}

struct GardenSnapshot {
  let plants: [GardenPlant]
  let syncedAt: Date
  let isPaused: Bool

  /// Mirrors effectiveHydration in src/lib/garden.ts, decaying forward from syncedAt.
  func hydration(of plant: GardenPlant, at date: Date) -> Double {
    if isPaused { return plant.hydration }
    let days = max(0, date.timeIntervalSince(syncedAt) / 86_400)
    return min(100, max(0, plant.hydration - plant.decayRatePerDay * days))
  }

  /// Thirstiest first — the widget's canonical order.
  func sorted(at date: Date) -> [GardenPlant] {
    plants.sorted { hydration(of: $0, at: date) < hydration(of: $1, at: date) }
  }

  static func load() -> GardenSnapshot {
    let defaults = UserDefaults(suiteName: APP_GROUP)
    let iso = ISO8601DateFormatter()
    let isoFrac = ISO8601DateFormatter()
    isoFrac.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    func parse(_ s: String?) -> Date? {
      guard let s, !s.isEmpty else { return nil }
      return isoFrac.date(from: s) ?? iso.date(from: s)
    }

    let rows = loadGardenRows(defaults)
    let plants = rows.compactMap { row -> GardenPlant? in
      guard let id = row["id"] as? String, let name = row["name"] as? String else { return nil }
      return GardenPlant(
        id: id,
        name: name,
        plantType: row["plantType"] as? String ?? "cactus",
        hydration: (row["hydration"] as? NSNumber)?.doubleValue ?? 100,
        decayRatePerDay: (row["decayRatePerDay"] as? NSNumber)?.doubleValue ?? 100 / 7,
        lastContactAt: parse(row["lastContactAt"] as? String),
        frequency: (row["frequency"] as? String ?? "weekly").lowercased()
      )
    }
    return GardenSnapshot(
      plants: plants,
      syncedAt: parse(defaults?.string(forKey: "syncedAt")) ?? Date(),
      isPaused: (defaults?.object(forKey: "isPaused") as? NSNumber)?.boolValue ?? false
    )
  }
}

func lastContactLabel(_ date: Date?, now: Date) -> String {
  guard let date else { return "no contact yet" }
  let days = Int(now.timeIntervalSince(date) / 86_400)
  if days <= 0 { return "today" }
  if days == 1 { return "1d ago" }
  return "\(days)d ago"
}

// MARK: - Paging state + intents

func pageKey(_ family: WidgetFamily) -> String {
  switch family {
  case .systemSmall: return "pageSmall"
  case .systemMedium: return "pageMedium"
  default: return "pageLarge"
  }
}

func pageSize(_ family: WidgetFamily) -> Int {
  switch family {
  case .systemSmall: return 1
  case .systemMedium: return 4
  default: return 8
  }
}

func currentPage(_ key: String, count: Int, size: Int) -> Int {
  let pages = max(1, Int(ceil(Double(count) / Double(size))))
  let stored = UserDefaults(suiteName: APP_GROUP)?.integer(forKey: key) ?? 0
  return ((stored % pages) + pages) % pages
}

struct CyclePageIntent: AppIntent {
  static var title: LocalizedStringResource = "Show other plants"
  static var isDiscoverable = false

  @Parameter(title: "Page key") var key: String
  @Parameter(title: "Step") var delta: Int
  @Parameter(title: "Page size") var size: Int

  init() {}
  init(key: String, delta: Int, size: Int) {
    self.key = key
    self.delta = delta
    self.size = size
  }

  func perform() async throws -> some IntentResult {
    let defaults = UserDefaults(suiteName: APP_GROUP)
    let count = loadGardenRows(defaults).count
    let pages = max(1, Int(ceil(Double(count) / Double(max(1, size)))))
    let stored = defaults?.integer(forKey: key) ?? 0
    defaults?.set(((stored + delta) % pages + pages) % pages, forKey: key)
    return .result()
  }
}

// MARK: - Timeline

struct GardenEntry: TimelineEntry {
  let date: Date
  let snapshot: GardenSnapshot
}

struct GardenProvider: TimelineProvider {
  func placeholder(in context: Context) -> GardenEntry {
    GardenEntry(date: Date(), snapshot: .load())
  }

  func getSnapshot(in context: Context, completion: @escaping (GardenEntry) -> Void) {
    completion(GardenEntry(date: Date(), snapshot: .load()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<GardenEntry>) -> Void) {
    // Hourly entries recompute decay so plants wilt on the home screen even
    // when the app stays closed; the app also force-reloads on every sync.
    let snapshot = GardenSnapshot.load()
    let now = Date()
    let entries = (0..<12).map { hour in
      GardenEntry(date: now.addingTimeInterval(Double(hour) * 3600), snapshot: snapshot)
    }
    completion(Timeline(entries: entries, policy: .atEnd))
  }
}

// MARK: - Building blocks

struct HydrationBar: View {
  let pct: Double
  var height: CGFloat = 8

  var body: some View {
    GeometryReader { geo in
      ZStack(alignment: .leading) {
        RoundedRectangle(cornerRadius: 3)
          .fill(Tokens.track)
        RoundedRectangle(cornerRadius: 3)
          .fill(Tokens.ramp(pct))
          .frame(width: max(6, geo.size.width * pct / 100))
      }
      .overlay(RoundedRectangle(cornerRadius: 3).stroke(Tokens.wood, lineWidth: 1))
    }
    .frame(height: height)
  }
}

struct Sprite: View {
  let plant: GardenPlant
  let pct: Double

  var body: some View {
    Image(plant.spriteName)
      .resizable()
      .interpolation(.none) // keep pixels crisp
      .scaledToFit()
      .opacity(pct <= WILT_THRESHOLD ? 0.55 : 1) // wilt = faded sprite, no badge
  }
}

struct ArrowButton: View {
  let family: WidgetFamily
  let delta: Int
  let enabled: Bool

  var body: some View {
    Button(intent: CyclePageIntent(key: pageKey(family), delta: delta, size: pageSize(family))) {
      Image(systemName: delta < 0 ? "chevron.left" : "chevron.right")
        .font(.system(size: 10, weight: .heavy))
        .foregroundStyle(Tokens.accent)
        .frame(width: 22, height: 22)
        .background(RoundedRectangle(cornerRadius: 6).fill(Tokens.chip))
        .overlay(RoundedRectangle(cornerRadius: 6).stroke(Tokens.wood, lineWidth: 1.5))
    }
    .buttonStyle(.plain)
    .opacity(enabled ? 1 : 0.35)
    .disabled(!enabled)
  }
}

struct EmptyGarden: View {
  var body: some View {
    Link(destination: URL(string: "rooted://add-friend")!) {
      VStack(spacing: 8) {
        RoundedRectangle(cornerRadius: 5)
          .strokeBorder(Tokens.inkMuted, style: StrokeStyle(lineWidth: 2, dash: [4, 3]))
          .frame(width: 40, height: 30)
          .overlay(Image(systemName: "plus").font(.system(size: 12, weight: .bold)).foregroundStyle(Tokens.inkMuted))
        Text("PLANT YOUR FIRST FRIEND")
          .font(pixelFont(15))
          .foregroundStyle(Tokens.inkMuted)
          .multilineTextAlignment(.center)
      }
    }
  }
}

// MARK: - Small: single plant + twin arrows

struct SmallView: View {
  let entry: GardenEntry

  var body: some View {
    let sorted = entry.snapshot.sorted(at: entry.date)
    if sorted.isEmpty {
      EmptyGarden()
    } else {
      let page = currentPage(pageKey(.systemSmall), count: sorted.count, size: 1)
      let plant = sorted[min(page, sorted.count - 1)]
      let pct = entry.snapshot.hydration(of: plant, at: entry.date)

      ZStack {
        // Content column
        VStack(spacing: 0) {
          Sprite(plant: plant, pct: pct)
            .frame(height: 64)
          Text(plant.name.uppercased())
            .font(pixelFont(19))
            .foregroundStyle(Tokens.ink)
            .lineLimit(1)
            .padding(.horizontal, 24) // clear the edge arrows
            .padding(.top, 6)
          HStack(spacing: 3) {
            HydrationBar(pct: pct, height: 8)
            Text("\(Int(pct.rounded()))%")
              .font(pixelFont(15))
              .foregroundStyle(Tokens.inkSoft)
          }
          .padding(.horizontal, 8)
          .padding(.top, 6)
          Text("\(lastContactLabel(plant.lastContactAt, now: entry.date)) · \(plant.frequency)")
            .font(pixelFont(13))
            .foregroundStyle(Tokens.inkMuted)
            .lineLimit(1)
            .padding(.top, 3)
        }
        .widgetURL(URL(string: "rooted://plant/\(plant.id)"))

        // Twin arrows, y-centered on the edges
        HStack {
          ArrowButton(family: .systemSmall, delta: -1, enabled: sorted.count > 1)
          Spacer()
          ArrowButton(family: .systemSmall, delta: 1, enabled: sorted.count > 1)
        }
      }
    }
  }
}

// MARK: - Rows: medium (1×4) and large (2×4)

struct SlotView: View {
  let snapshot: GardenSnapshot
  let plant: GardenPlant
  let date: Date

  var body: some View {
    let pct = snapshot.hydration(of: plant, at: date)
    Link(destination: URL(string: "rooted://plant/\(plant.id)")!) {
      VStack(spacing: 3) {
        Sprite(plant: plant, pct: pct)
          .frame(height: 42)
        Text(plant.name.uppercased())
          .font(pixelFont(14))
          .foregroundStyle(Tokens.ink)
          .lineLimit(1)
        HydrationBar(pct: pct, height: 6)
        Text(lastContactLabel(plant.lastContactAt, now: date))
          .font(pixelFont(12))
          .foregroundStyle(Tokens.inkMuted)
          .lineLimit(1)
      }
    }
  }
}

struct GhostSlot: View {
  var body: some View {
    Link(destination: URL(string: "rooted://add-friend")!) {
      VStack(spacing: 3) {
        RoundedRectangle(cornerRadius: 5)
          .strokeBorder(Tokens.inkMuted, style: StrokeStyle(lineWidth: 2, dash: [4, 3]))
          .frame(width: 30, height: 24)
          .overlay(Image(systemName: "plus").font(.system(size: 10, weight: .bold)).foregroundStyle(Tokens.inkMuted))
          .frame(height: 42, alignment: .bottom)
        Text("ADD")
          .font(pixelFont(14))
          .foregroundStyle(Tokens.inkMuted)
      }
    }
  }
}

struct RowsView: View {
  let entry: GardenEntry
  let family: WidgetFamily

  var body: some View {
    let sorted = entry.snapshot.sorted(at: entry.date)
    if sorted.isEmpty {
      EmptyGarden()
    } else {
      let size = pageSize(family)
      let page = currentPage(pageKey(family), count: sorted.count, size: size)
      let window = Array(sorted.dropFirst(page * size).prefix(size))
      let rows: [[GardenPlant]] = family == .systemMedium
        ? [window]
        : [Array(window.prefix(4)), Array(window.dropFirst(4))]

      VStack(alignment: .leading, spacing: family == .systemMedium ? 4 : 10) {
        Text("MY GARDEN")
          .font(pixelFont(15))
          .foregroundStyle(Tokens.accent)

        ZStack {
          VStack(spacing: family == .systemMedium ? 0 : 14) {
            ForEach(rows.indices, id: \.self) { r in
              HStack(alignment: .bottom, spacing: 8) {
                ForEach(rows[r]) { plant in
                  SlotView(snapshot: entry.snapshot, plant: plant, date: entry.date)
                    .frame(maxWidth: .infinity)
                }
                // Ghost pot fills the first empty slot on the last used row
                if rows[r].count < 4 {
                  GhostSlot().frame(maxWidth: .infinity)
                  ForEach(0..<(3 - rows[r].count), id: \.self) { _ in
                    Color.clear.frame(maxWidth: .infinity)
                  }
                }
              }
            }
            // Large with ≤4 plants: second row is ghost + blanks
            if family != .systemMedium && rows.count == 1 {
              HStack(alignment: .bottom, spacing: 8) {
                GhostSlot().frame(maxWidth: .infinity)
                ForEach(0..<3, id: \.self) { _ in Color.clear.frame(maxWidth: .infinity) }
              }
            }
          }
          .padding(.horizontal, 26)

          HStack {
            ArrowButton(family: family, delta: -1, enabled: sorted.count > size)
            Spacer()
            ArrowButton(family: family, delta: 1, enabled: sorted.count > size)
          }
        }
      }
    }
  }
}

// MARK: - Widget definition

struct RootedGardenView: View {
  @Environment(\.widgetFamily) var family
  let entry: GardenEntry

  var body: some View {
    Group {
      if family == .systemSmall {
        SmallView(entry: entry)
      } else {
        RowsView(entry: entry, family: family)
      }
    }
    .containerBackground(Tokens.surface, for: .widget)
  }
}

struct RootedGardenWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "RootedGarden", provider: GardenProvider()) { entry in
      RootedGardenView(entry: entry)
    }
    .configurationDisplayName("My Garden")
    .description("Your friends' plants, thirstiest first.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}

@main
struct RootedWidgetBundle: WidgetBundle {
  var body: some Widget {
    RootedGardenWidget()
  }
}
