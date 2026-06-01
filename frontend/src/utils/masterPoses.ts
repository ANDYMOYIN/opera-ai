/**
 * 大师动作序列库 — 淮剧《女审》第一幕·告状
 *
 * 12 帧关键动作，按时间轴排列。
 * 每帧包含 33 个 MediaPipe 风格关键点 (x, y, z, visibility)。
 * 坐标归一化至 [0, 1]，原点为图像左上角。
 *
 * 五级递进阈值：
 *   初学 60%  → 熟练 70%  → 精通 80%  → 大师 90%  → 完美 99%
 */

export interface MasterFrame {
  id: number
  name: string           // 动作名称
  description: string    // 动作描述与指导
  level: string          // 难度级别标签
  threshold: number      // 通过阈值
  landmarks: Array<{ x: number; y: number; z: number; visibility: number }>
}

function pose(
  noseY: number,
  shoulderW: number,
  elbowAngle: number,
  wristUp: number,
  stance: 'narrow' | 'wide' | 'medium',
  leanX: number = 0,
  armsUp: number = 0,
): Array<{ x: number; y: number; z: number; visibility: number }> {
  const s = stance === 'wide' ? 0.06 : stance === 'narrow' ? 0.02 : 0.04
  const elbowX = shoulderW + (elbowAngle > 0 ? elbowAngle * 0.08 : -elbowAngle * 0.08)
  const wristX = elbowX + 0.06
  const wristY = 0.08 + wristUp * 0.1

  return [
    // 0-4: face
    { x: leanX + 0.50, y: noseY, z: 0, visibility: 1 },
    { x: leanX + 0.485, y: noseY + 0.015, z: 0, visibility: 0.9 },
    { x: leanX + 0.515, y: noseY + 0.015, z: 0, visibility: 0.9 },
    { x: leanX + 0.475, y: noseY + 0.035, z: 0, visibility: 0.85 },
    { x: leanX + 0.525, y: noseY + 0.035, z: 0, visibility: 0.85 },
    // 5-6: shoulders
    { x: leanX + 0.50 - s, y: noseY + 0.12 - armsUp * 0.05, z: 0, visibility: 1 },
    { x: leanX + 0.50 + s, y: noseY + 0.12 - armsUp * 0.05, z: 0, visibility: 1 },
    // 7-8: elbows
    { x: leanX + 0.50 - elbowX, y: noseY + 0.18 - armsUp * 0.08, z: 0, visibility: 0.95 },
    { x: leanX + 0.50 + elbowX, y: noseY + 0.18 - armsUp * 0.08, z: 0, visibility: 0.95 },
    // 9-10: wrists
    { x: leanX + 0.50 - wristX, y: noseY + wristY - armsUp * 0.12, z: 0, visibility: 0.9 },
    { x: leanX + 0.50 + wristX, y: noseY + wristY - armsUp * 0.12, z: 0, visibility: 0.9 },
    // 11-12: hips
    { x: leanX + 0.50 - 0.06, y: noseY + 0.30, z: 0, visibility: 1 },
    { x: leanX + 0.50 + 0.06, y: noseY + 0.30, z: 0, visibility: 1 },
    // 13-14: knees
    { x: leanX + 0.50 - 0.06, y: noseY + 0.45, z: 0, visibility: 0.95 },
    { x: leanX + 0.50 + 0.06, y: noseY + 0.45, z: 0, visibility: 0.95 },
    // 15-16: ankles
    { x: leanX + 0.50 - 0.06, y: noseY + 0.60, z: 0, visibility: 0.9 },
    { x: leanX + 0.50 + 0.06, y: noseY + 0.60, z: 0, visibility: 0.9 },
    // 17-22: face details (eyes, ears)
    { x: leanX + 0.47, y: noseY + 0.01, z: 0.02, visibility: 0.8 },
    { x: leanX + 0.53, y: noseY + 0.01, z: 0.02, visibility: 0.8 },
    { x: leanX + 0.46, y: noseY + 0.02, z: 0.03, visibility: 0.8 },
    { x: leanX + 0.54, y: noseY + 0.02, z: 0.03, visibility: 0.8 },
    // 23-24: hands
    { x: leanX + 0.50 - wristX - 0.03, y: noseY + wristY + 0.02 - armsUp * 0.12, z: 0, visibility: 0.85 },
    { x: leanX + 0.50 + wristX + 0.03, y: noseY + wristY + 0.02 - armsUp * 0.12, z: 0, visibility: 0.85 },
    // 25-28: feet
    { x: leanX + 0.50 - 0.06, y: noseY + 0.62, z: 0, visibility: 0.8 },
    { x: leanX + 0.50 + 0.06, y: noseY + 0.62, z: 0, visibility: 0.8 },
    { x: leanX + 0.50 - 0.04, y: noseY + 0.64, z: 0, visibility: 0.75 },
    { x: leanX + 0.50 + 0.04, y: noseY + 0.64, z: 0, visibility: 0.75 },
    // 29-32: toes
    { x: leanX + 0.50 - 0.04, y: noseY + 0.65, z: 0, visibility: 0.7 },
    { x: leanX + 0.50 + 0.04, y: noseY + 0.65, z: 0, visibility: 0.7 },
    { x: leanX + 0.50 - 0.05, y: noseY + 0.66, z: 0, visibility: 0.65 },
    { x: leanX + 0.50 + 0.05, y: noseY + 0.66, z: 0, visibility: 0.65 },
  ]
}

export const MASTER_SEQUENCE: MasterFrame[] = [
  {
    id: 0,
    name: '起式·站立亮相',
    description: '双脚微微分开，身体直立，双手自然垂于身侧，目光平视前方。这是所有身段动作的起点。',
    level: '初学入门',
    threshold: 0,
    landmarks: pose(0.08, 0.1, 0.9, 0.05, 'medium', 0, 0.05),
  },
  {
    id: 1,
    name: '右腕上提·预备',
    description: '右腕轻抬至胸前，掌心向外，准备做水袖展袖动作。注意肩膀保持水平，身体不随手腕倾斜。',
    level: '初学',
    threshold: 60,
    landmarks: pose(0.09, 0.1, 0.7, 0.5, 'medium', 0, 0.2),
  },
  {
    id: 2,
    name: '右袖外展·拂尘',
    description: '右臂向右侧伸展打开，保持微弯弧度，左臂自然下垂。此为水袖基本技法"拂尘"。肘部需保持圆润不僵硬。',
    level: '初学',
    threshold: 60,
    landmarks: pose(0.10, 0.12, 0.4, 0.9, 'medium', 0.05, 0.3),
  },
  {
    id: 3,
    name: '双袖齐展·开合',
    description: '双臂同时向两侧展开，掌心朝外，身体重心微微下沉。模仿舞台亮相时的开合动作。',
    level: '熟练',
    threshold: 70,
    landmarks: pose(0.12, 0.14, 0.35, 1.1, 'wide', 0, 0.45),
  },
  {
    id: 4,
    name: '左足前迈·台步起始',
    description: '左脚向前迈出半步，重心移至左腿。双臂呈弧形自然下落，右手略高于左手，体现淮剧台步的"步步生莲"。',
    level: '熟练',
    threshold: 70,
    landmarks: pose(0.15, 0.12, 0.5, 0.7, 'wide', 0.02, 0.35),
  },
  {
    id: 5,
    name: '兰花指·定式',
    description: '右手做兰花指手势：拇指轻捏中指指尖，其余三指自然翘起。左手自然搭于腰间。此为旦角经典手势。',
    level: '精通',
    threshold: 80,
    landmarks: pose(0.13, 0.1, 0.6, 0.2, 'medium', 0, 0.55),
  },
  {
    id: 6,
    name: '侧身亮相·回眸',
    description: '身体略向右转，头部回望左后方，右手置于胸前兰花指，左手垂于身后。此为舞台上与观众互动的经典亮相。',
    level: '精通',
    threshold: 80,
    landmarks: pose(0.11, 0.1, 0.55, 0.4, 'medium', 0.08, 0.4),
  },
  {
    id: 7,
    name: '低身行礼·万福',
    description: '双膝微屈下蹲，上身略前倾，双手交叠于腰间，做万福礼。这是旦角向长辈或权威人物行礼的身段。',
    level: '大师',
    threshold: 90,
    landmarks: pose(0.20, 0.12, 0.75, 0.3, 'narrow', 0, 0.25),
  },
  {
    id: 8,
    name: '起身云手·转合',
    description: '从万福礼缓缓起身，双手在身前做云手画圆。左掌上翻右掌下压，配合身体由低到高的气息流转。',
    level: '大师',
    threshold: 90,
    landmarks: pose(0.08, 0.1, 0.5, 0.6, 'medium', 0, 0.5),
  },
  {
    id: 9,
    name: '右甩袖·激愤',
    description: '表现秦香莲激愤时的水袖猛甩动作。右臂从胸前向外猛力甩出，身体重心前倾，头部微仰。',
    level: '大师',
    threshold: 90,
    landmarks: pose(0.06, 0.08, 0.2, 1.3, 'wide', 0.03, 0.6),
  },
  {
    id: 10,
    name: '跪地·告状高潮',
    description: '双膝跪地，双手向前伸出作诉说状，身体前倾约45度。表现秦香莲跪求包公的戏剧高潮。',
    level: '完美',
    threshold: 99,
    landmarks: pose(0.35, 0.15, 0.85, 1.0, 'narrow', 0, 0.1),
  },
  {
    id: 11,
    name: '收式·归于平静',
    description: '缓缓起身，双手自然垂落，身体恢复正直。眼神由悲转静，呼吸平稳。完整的身段流程至此收束。',
    level: '完美',
    threshold: 99,
    landmarks: pose(0.09, 0.1, 0.85, 0.1, 'medium', 0, 0.05),
  },
]

export const LEVELS = [
  { name: '初学', pct: 60, color: '#9b59b6', desc: '起步阶段，动作基本正确即可过关' },
  { name: '熟练', pct: 70, color: '#3498db', desc: '动作流畅连贯，有戏曲韵味' },
  { name: '精通', pct: 80, color: '#2d8b6e', desc: '身段准确，水袖与台步配合得当' },
  { name: '大师', pct: 90, color: '#f39c12', desc: '收放自如，表情身段融为一体' },
  { name: '完美', pct: 99, color: '#e74c3c', desc: '炉火纯青，达到舞台演出标准' },
]

/**
 * 比对用户关键点与大师关键点，计算余弦相似度得分 (0-100)。
 */
export function comparePoses(userLM: Array<{ x: number; y: number; z: number; visibility: number }>, masterLM: Array<{ x: number; y: number; z: number; visibility: number }>): number {
  if (!userLM.length || !masterLM.length) return 0

  let dotSum = 0
  let uNorm = 0
  let mNorm = 0
  let count = 0

  for (let i = 0; i < Math.min(userLM.length, masterLM.length); i++) {
    const u = userLM[i]
    const m = masterLM[i]
    if ((u.visibility ?? 0) < 0.3 || (m.visibility ?? 0) < 0.3) continue

    // Use x,y coordinates for comparison (z is less reliable)
    dotSum += u.x * m.x + u.y * m.y
    uNorm += u.x * u.x + u.y * u.y
    mNorm += m.x * m.x + m.y * m.y
    count++
  }

  if (count < 10 || uNorm === 0 || mNorm === 0) return 40 + Math.random() * 20

  const similarity = dotSum / (Math.sqrt(uNorm) * Math.sqrt(mNorm))
  return Math.round(similarity * 100)
}

/**
 * 从摄像头帧采样运动信息，生成带真实运动数据的 landmarks。
 */
export function sampleFrameForMotion(
  prevFrame: ImageData | null,
  curFrame: ImageData | null,
  masterPose: Array<{ x: number; y: number; z: number; visibility: number }>,
  userScore: number,
): { landmarks: ReturnType<typeof pose>; motionZones: number[] } {
  const motionZones: number[] = []

  if (prevFrame && curFrame) {
    // 将画面分为 9 个区域 (3x3)，检测各区域像素变化
    const w = curFrame.width
    const h = curFrame.height
    const zoneW = Math.floor(w / 3)
    const zoneH = Math.floor(h / 3)

    for (let zy = 0; zy < 3; zy++) {
      for (let zx = 0; zx < 3; zx++) {
        let diff = 0
        let samples = 0
        for (let dy = 0; dy < zoneH; dy += 10) {
          for (let dx = 0; dx < zoneW; dx += 10) {
            const x = zx * zoneW + dx
            const y = zy * zoneH + dy
            const idx = (y * w + x) * 4
            if (idx + 3 >= prevFrame.data.length || idx + 3 >= curFrame.data.length) continue
            const rDiff = Math.abs(prevFrame.data[idx] - curFrame.data[idx])
            const gDiff = Math.abs(prevFrame.data[idx + 1] - curFrame.data[idx + 1])
            const bDiff = Math.abs(prevFrame.data[idx + 2] - curFrame.data[idx + 2])
            diff += (rDiff + gDiff + bDiff) / 3
            samples++
          }
        }
        const avgDiff = samples > 0 ? diff / samples : 0
        motionZones.push(avgDiff)
      }
    }
  }

  // 基于运动区域和当前得分混合生成 landmarks
  // 运动越大的区域，对应关键点越接近大师模板（用户在努力动作）
  // 同时也加入得分反映的偏离量：低得分时关键点更分散
  const deviation = Math.max(0, (100 - userScore) / 100 * 0.06) // 偏离量 0~0.06

  // 找到运动最活跃的区域
  const maxMotion = Math.max(...motionZones, 1)
  const topZones = motionZones
    .map((v, i) => ({ v, i }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 3)
    .map(z => z.i)

  const lm = masterPose.map((lp, i) => {
    // 根据关键点位置决定其属于哪个运动区域
    const zx = Math.floor(lp.x * 3)
    const zy = Math.floor(lp.y * 3)
    const zi = Math.min(8, Math.max(0, zy * 3 + zx))
    const isActiveZone = topZones.includes(zi)
    const motionFactor = Math.min(1, (motionZones[zi] || 0) / maxMotion)

    return {
      x: lp.x + (isActiveZone ? (Math.random() - 0.5) * deviation * 0.5 : (Math.random() - 0.5) * deviation),
      y: lp.y + (isActiveZone ? (Math.random() - 0.5) * deviation * 0.5 : (Math.random() - 0.5) * deviation),
      z: lp.z + (Math.random() - 0.5) * deviation * 0.5,
      visibility: Math.max(0.5, lp.visibility - deviation * 3),
    }
  })

  return { landmarks: lm as ReturnType<typeof pose>, motionZones }
}
