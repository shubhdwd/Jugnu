import { prisma } from '../../config/database';
import { detectTrendRemote } from '../../services/ai.service';

export async function getByPatient(patientId: string) {
  return prisma.insight.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTrends(patientId: string) {
  const insights = await prisma.insight.findMany({
    where: { patientId },
    orderBy: { createdAt: 'asc' },
  });

  const domains = [...new Set(insights.map(i => i.cognitiveDomain))];
  const trends = await Promise.all(domains.map(async domain => {
    const domainInsights = insights.filter(i => i.cognitiveDomain === domain);
    const trend = await detectTrendRemote(domainInsights.map(i => ({
      abilityEstimate: i.abilityEstimate,
      createdAt: i.createdAt,
    })));
    const latest = domainInsights[domainInsights.length - 1];
    return {
      domain,
      trend,
      currentAbility: latest?.abilityEstimate || 0,
      dataPoints: domainInsights.length,
      latestInsight: latest || null,
    };
  }));

  return trends;
}

export async function getAbility(patientId: string) {
  const insights = await prisma.insight.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
  });

  if (insights.length === 0) {
    return { overall: null, domains: [] };
  }

  const domains = [...new Set(insights.map(i => i.cognitiveDomain))];
  const domainAbilities = domains.map(domain => {
    const latest = insights.find(i => i.cognitiveDomain === domain);
    return {
      domain,
      ability: latest?.abilityEstimate || 0,
      trend: latest?.trend || null,
    };
  });

  const overall = domainAbilities.reduce((sum, d) => sum + d.ability, 0) / domainAbilities.length;

  return { overall, domains: domainAbilities };
}
