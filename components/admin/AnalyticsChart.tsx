"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
  { name: "Jan", members: 10 },
  { name: "Feb", members: 15 },
  { name: "Mar", members: 12 },
  { name: "Apr", members: 20 },
  { name: "May", members: 25 },
  { name: "Jun", members: 30 },
];

export function AnalyticsChart() {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white font-playfair">Membership Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#ffffff60" />
              <YAxis stroke="#ffffff60" />
              <Tooltip contentStyle={{ backgroundColor: "#121212", border: "1px solid rgba(255,255,255,0.1)" }} />
              <Bar dataKey="members" fill="#c9a84c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
