export interface InstitutionStat {
  label: string;
  value: string;
  category: 'capacity' | 'area' | 'distance' | 'personnel' | 'history';
  highlight?: boolean;
}

export interface ParsedInstitutionData {
  formerName?: string;
  cleanOverview: string;
  stats: InstitutionStat[];
  infrastructureNotes?: string;
}

export function parseInstitutionInfo(description?: string | null): ParsedInstitutionData {
  if (!description) {
    return {
      cleanOverview: 'Chưa có thông tin mô tả chi tiết.',
      stats: [],
    };
  }

  const stats: InstitutionStat[] = [];

  // Extract former name (e.g., (tên cũ cơ sở cai nghiện ma túy Thanh Thiếu Niên 2))
  let formerName: string | undefined;
  const formerNameMatch = description.match(/\(tên cũ ([^)]+)\)/i);
  if (formerNameMatch) {
    formerName = formerNameMatch[1].trim();
  }

  // 1. Land Area (Diện tích)
  const areaMatch = description.match(/(?:diện tích đất|tổng diện tích[^:]*):?\s*(?:được bàn giao cho CATP\s*)?([0-9,.]+\s*(?:ha|m²|m2))/i);
  if (areaMatch) {
    stats.push({
      label: 'Diện tích đất',
      value: areaMatch[1].trim(),
      category: 'area',
      highlight: true,
    });
  }

  // 2. Design Capacity (Quy mô thiết kế)
  const scaleMatch = description.match(/quy mô\s*:?\s*([0-9,.]+\s*học viên)/i);
  if (scaleMatch) {
    stats.push({
      label: 'Quy mô thiết kế',
      value: scaleMatch[1].trim(),
      category: 'capacity',
      highlight: true,
    });
  }

  // 3. Current Inmates (Đang tiếp nhận / quản lý)
  const currentMatch = description.match(/(?:đang tiếp nhận|số học viên đang tiếp nhận|hiện đang quản lý)\s*:?\s*([0-9,.]+\s*học viên|[0-9,.]+\s*NCN)/i);
  if (currentMatch) {
    stats.push({
      label: 'Đang tiếp nhận',
      value: currentMatch[1].trim(),
      category: 'capacity',
      highlight: true,
    });
  }

  // 4. Peak Capacity (Thời điểm cao nhất)
  const peakMatch = description.match(/thời điểm cao nhất\s*:?\s*([0-9,.]+\s*học viên|[0-9,.]+\s*NCN)/i);
  if (peakMatch) {
    stats.push({
      label: 'Cao điểm từng đạt',
      value: peakMatch[1].trim(),
      category: 'capacity',
    });
  }

  // 5. Distance from PC04 Headquarters
  const distanceMatch = description.match(/khoảng cách từ PC04[^:]*:\s*([0-9,.]+\s*(?:KM|km))/i);
  if (distanceMatch) {
    stats.push({
      label: 'Khoảng cách từ PC04',
      value: distanceMatch[1].trim().toUpperCase(),
      category: 'distance',
    });
  }

  // 6. Leadership officers count
  const chiefMatch = description.match(/tổng số chỉ huy[^:]*:\s*([0-9,.]+)/i);
  if (chiefMatch) {
    stats.push({
      label: 'Ban chỉ huy',
      value: `${chiefMatch[1].trim()} đồng chí`,
      category: 'personnel',
    });
  }

  // 7. Officers / Personnel count
  const staffMatch = description.match(/tổng số cán bộ[^:]*:\s*([0-9,.]+)/i);
  if (staffMatch) {
    stats.push({
      label: 'Cán bộ chiến sĩ',
      value: `${staffMatch[1].trim()} đồng chí`,
      category: 'personnel',
    });
  }

  // 8. Contract workers
  const workerMatch = description.match(/tổng số HĐLĐ[^:]*:\s*([0-9,.]+)/i);
  if (workerMatch) {
    stats.push({
      label: 'Lao động hợp đồng',
      value: `${workerMatch[1].trim()} người`,
      category: 'personnel',
    });
  }

  // Clean overview sentence(s) before the raw tabulations
  let cleanOverview = description;
  const rawListIndex = description.search(/Khoảng cách từ PC04|Tổng diện tích toàn cơ sở/i);
  if (rawListIndex > 0) {
    cleanOverview = description.substring(0, rawListIndex).trim();
  }

  // Infrastructure notes if mentioned
  let infrastructureNotes: string | undefined;
  const infraMatch = description.match(/(Các công trình[^.]+[\s\S]*?(?:xuống cấp|năm \d{4}|sử dụng))/i);
  if (infraMatch) {
    infrastructureNotes = infraMatch[1].trim();
  }

  return {
    formerName,
    cleanOverview,
    stats,
    infrastructureNotes,
  };
}
