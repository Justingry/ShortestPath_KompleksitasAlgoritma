/**
 * ============================================================================
 * PROGRAM SIMULASI SHORTEST PATH OSPF (DIJKSTRA MIN-HEAP) DALAM BAHASA C++
 * ============================================================================
 * Tugas Mata Kuliah : Kompleksitas Algoritma
 * Topik             : Pencarian Jalur Terpendek (Shortest Path) Metode OSPF
 * Topologi          : 10 Router (R0 - R9) dan 14 Link (sesuai gambar topologi)
 *
 * KEUNGGULAN VERSI C++ (DIBANDINGKAN C MURNI):
 * 1. Menggunakan STL `std::priority_queue` (Binary Min-Heap) & `std::vector`
 *    (Adjacency List) sehingga Kompleksitas Waktu meningkat menjadi
 *    O((V + E) log V), jauh lebih efisien daripada Adjacency Matrix O(V^2)!
 * 2. Struktur kode berbasis Object-Oriented Programming (`class OSPFNetwork`)
 *    yang bersih, modern, dan sangat mudah diintegrasikan ke WebAssembly (Wasm)
 *    menggunakan Emscripten `EMSCRIPTEN_BINDINGS` atau CGI Backend.
 *
 * CARA KOMPILASI & MENJALANKAN DI TERMINAL:
 *   g++ -std=c++17 ospf_shortest_path.cpp -o ospf_cpp
 *   ./ospf_cpp
 * ============================================================================
 */

#include <iostream>
#include <vector>
#include <queue>
#include <iomanip>
#include <string>
#include <algorithm>

using namespace std;

const int INF = 999999;
const int REF_BANDWIDTH = 100; // Reference Bandwidth standar FastEthernet = 100 Mbps

// Struktur data untuk menyimpan informasi Link (Kabel antar Router)
struct Edge {
    int id;
    int u;              // Router asal
    int v;              // Router tujuan
    int bandwidth_mbps; // Bandwidth dalam Mbps
    int cost;           // OSPF Cost = 100 / bandwidth_mbps
    bool active;        // Status link: true = UP (Aktif), false = DOWN (Mati)
};

// Kelas Utama Jaringan OSPF
class OSPFNetwork {
private:
    int num_nodes;
    vector<bool> node_active;
    vector<Edge> edges;

public:
    int op_heap_pushes = 0;
    int op_heap_pops = 0;
    int op_neighbor_checks = 0;
    int op_relaxations = 0;

    OSPFNetwork() : num_nodes(10), node_active(10, true) {
        // Inisialisasi 14 Link sesuai gambar topologi R0 - R9
        edges = {
            {0,  0, 1, 10,  10, true}, // R0 - R1 : 10 Mbps,  Cost = 10
            {1,  0, 2, 50,  2,  true}, // R0 - R2 : 50 Mbps,  Cost = 2
            {2,  1, 2, 25,  4,  true}, // R1 - R2 : 25 Mbps,  Cost = 4
            {3,  1, 3, 50,  2,  true}, // R1 - R3 : 50 Mbps,  Cost = 2
            {4,  2, 3, 10,  10, true}, // R2 - R3 : 10 Mbps,  Cost = 10
            {5,  3, 4, 100, 1,  true}, // R3 - R4 : 100 Mbps, Cost = 1
            {6,  3, 5, 25,  4,  true}, // R3 - R5 : 25 Mbps,  Cost = 4
            {7,  4, 6, 100, 1,  true}, // R4 - R6 : 100 Mbps, Cost = 1
            {8,  5, 6, 25,  4,  true}, // R5 - R6 : 25 Mbps,  Cost = 4
            {9,  5, 7, 50,  2,  true}, // R5 - R7 : 50 Mbps,  Cost = 2
            {10, 6, 8, 50,  2,  true}, // R6 - R8 : 50 Mbps,  Cost = 2
            {11, 7, 8, 25,  4,  true}, // R7 - R8 : 25 Mbps,  Cost = 4
            {12, 7, 9, 20,  5,  true}, // R7 - R9 : 20 Mbps,  Cost = 5
            {13, 8, 9, 100, 1,  true}  // R8 - R9 : 100 Mbps, Cost = 1
        };
    }

    void toggleNode(int r) {
        if (r >= 0 && r < num_nodes) {
            node_active[r] = !node_active[r];
            cout << "[INFO] Status Router R" << r << " sekarang: "
                 << (node_active[r] ? "ON (Aktif)" : "OFF (Mati)") << "\n";
        }
    }

    void setNodeStatus(int r, bool status) {
        if (r >= 0 && r < num_nodes) node_active[r] = status;
    }

    void toggleEdge(int e) {
        if (e >= 0 && e < (int)edges.size()) {
            edges[e].active = !edges[e].active;
            cout << "[INFO] Status Link R" << edges[e].u << "-R" << edges[e].v
                 << " sekarang: " << (edges[e].active ? "UP (Aktif)" : "DOWN (Mati)") << "\n";
        }
    }

    void setEdgeStatus(int e, bool status) {
        if (e >= 0 && e < (int)edges.size()) edges[e].active = status;
    }

    void resetAll() {
        fill(node_active.begin(), node_active.end(), true);
        for (auto &edge : edges) edge.active = true;
    }

    // Rekonstruksi string jalur dari src ke target
    string formatPath(const vector<int> &parent, int target) const {
        vector<int> path;
        for (int v = target; v != -1; v = parent[v]) {
            path.push_back(v);
        }
        reverse(path.begin(), path.end());
        string s;
        for (size_t i = 0; i < path.size(); i++) {
            s += "R" + to_string(path[i]);
            if (i + 1 < path.size()) s += " -> ";
        }
        return s;
    }

    // Menentukan Next-Hop pertama dari src menuju dest
    int getNextHop(const vector<int> &parent, int src, int dest) const {
        if (dest == src || parent[dest] == -1) return -1;
        int curr = dest;
        while (parent[curr] != -1 && parent[curr] != src) {
            curr = parent[curr];
        }
        return curr;
    }

    /**
     * ALGORITMA DIJKSTRA MENGGUNAKAN STL PRIORITY QUEUE (MIN-HEAP) & ADJACENCY LIST
     * Kompleksitas Waktu : O((V + E) log V)
     * Kompleksitas Ruang : O(V + E)
     */
    void runDijkstra(int src, int dst, bool verbose = true) {
        op_heap_pushes = 0;
        op_heap_pops = 0;
        op_neighbor_checks = 0;
        op_relaxations = 0;

        // 1. Bangun Adjacency List dinamis: adj[u] berisi pasangan (tetangga v, cost)
        vector<vector<pair<int, int>>> adj(num_nodes);
        for (const auto &edge : edges) {
            if (edge.active && node_active[edge.u] && node_active[edge.v]) {
                adj[edge.u].push_back({edge.v, edge.cost});
                adj[edge.v].push_back({edge.u, edge.cost});
            }
        }

        vector<int> dist(num_nodes, INF);
        vector<int> parent(num_nodes, -1);
        vector<bool> visited(num_nodes, false);

        if (!node_active[src]) {
            cout << "\n[PERINGATAN] Router asal R" << src << " sedang MATI (OFF)!\n";
            return;
        }

        // Min-Heap menyimpan pasangan: (cost_saat_ini, id_router)
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;

        dist[src] = 0;
        pq.push({0, src});
        op_heap_pushes++;

        if (verbose) {
            cout << "\n========================================================================\n";
            cout << " EKSEKUSI DIJKSTRA C++ DENGAN STL PRIORITY_QUEUE (MIN-HEAP O((V+E)logV))\n";
            cout << "========================================================================\n";
        }

        int iteration = 0;
        while (!pq.empty()) {
            auto [d, u] = pq.top();
            pq.pop();
            op_heap_pops++;

            // Abaikan entri usang di dalam Min-Heap jika node sudah dikunjungi
            if (visited[u]) continue;
            visited[u] = true;
            iteration++;

            if (verbose) {
                cout << "Iterasi " << iteration << " [Pop Min-Heap]: Router R" << u
                     << " (Total Cost = " << d << ")\n";
            }

            // Hanya periksa tetangga yang benar-benar terhubung di Adjacency List!
            for (const auto &[v, weight] : adj[u]) {
                op_neighbor_checks++;
                if (!visited[v] && d + weight < dist[v]) {
                    int old_cost = dist[v];
                    dist[v] = d + weight;
                    parent[v] = u;
                    pq.push({dist[v], v});
                    op_heap_pushes++;
                    op_relaxations++;

                    if (verbose) {
                        cout << "   -> Relaksasi R" << v << " via R" << u
                             << " : Cost baru = " << dist[v] << " (sebelumnya "
                             << (old_cost == INF ? "INF" : to_string(old_cost))
                             << ") -> Push ke Min-Heap\n";
                    }
                }
            }
        }

        // Cetak Hasil Rute Terpendek
        cout << "\n========================================================================\n";
        cout << " HASIL JALUR TERPENDEK (OSPF SHORTEST PATH): R" << src << " menuju R" << dst << "\n";
        cout << "========================================================================\n";
        if (!node_active[dst] || dist[dst] == INF) {
            cout << "Status       : TIDAK TERJANGKAU (Unreachable / Jaringan Terputus)\n";
        } else {
            cout << "Status       : TERHUBUNG (Optimal OSPF Route Ditemukan)\n";
            cout << "Rute Terbaik : " << formatPath(parent, dst) << "\n";
            cout << "Total Cost   : " << dist[dst] << "\n";
        }

        // Cetak Tabel Routing OSPF
        cout << "\n------------------------------------------------------------------------\n";
        cout << " TABEL ROUTING OSPF PADA ROUTER R" << src << " (C++ STL Implementation)\n";
        cout << "------------------------------------------------------------------------\n";
        cout << left << setw(10) << "Tujuan" << " | "
             << setw(12) << "Status" << " | "
             << setw(10) << "Total Cost" << " | "
             << "Next-Hop & Jalur Lengkap\n";
        cout << "------------------------------------------------------------------------\n";

        for (int i = 0; i < num_nodes; i++) {
            cout << left << setw(10) << ("R" + to_string(i)) << " | ";
            if (i == src) {
                cout << setw(12) << "ONLINE" << " | "
                     << setw(10) << 0 << " | Local (Router Asal)\n";
            } else if (!node_active[i]) {
                cout << setw(12) << "NODE DOWN" << " | "
                     << setw(10) << "INF" << " | -\n";
            } else if (dist[i] == INF) {
                cout << setw(12) << "UNREACHABLE" << " | "
                     << setw(10) << "INF" << " | Jalur Terputus\n";
            } else {
                int nh = getNextHop(parent, src, i);
                cout << setw(12) << "REACHABLE" << " | "
                     << setw(10) << dist[i] << " | via R" << nh
                     << " (" << formatPath(parent, i) << ")\n";
            }
        }

        // Cetak Analisis Kompleksitas Algoritma (Perbandingan C++ Min-Heap vs C Matriks)
        cout << "------------------------------------------------------------------------\n";
        cout << " ANALISIS KOMPLEKSITAS ALGORITMA (C++ ADJACENCY LIST + MIN-HEAP)\n";
        cout << "------------------------------------------------------------------------\n";
        cout << "Jumlah Node (V) & Link (E)       : V = " << num_nodes << ", E = " << edges.size() << "\n";
        cout << "Operasi Cek Tetangga Aktual      : " << op_neighbor_checks << " kali (vs 214 di Matriks C)\n";
        cout << "Operasi Push / Pop Min-Heap      : " << op_heap_pushes << " push, " << op_heap_pops << " pop\n";
        cout << "Operasi Relaksasi (Update Cost)  : " << op_relaxations << " kali\n";
        cout << "Kompleksitas Waktu C++ (Min-Heap): O((V + E) log2 V) = ~79 operasi\n";
        cout << "Kompleksitas Ruang C++ (Adj List): O(V + E) (Hemat memori untuk graf jarang)\n";
        cout << "========================================================================\n";
    }

    void printTopologyStatus() const {
        cout << "\n--- STATUS ROUTER (NODE) ---\n";
        for (int i = 0; i < num_nodes; i++) {
            cout << "R" << i << ": [" << (node_active[i] ? "ON " : "OFF") << "]   ";
            if (i == 4 || i == 9) cout << "\n";
        }
        cout << "\n--- STATUS KABEL / LINK (EDGE) ---\n";
        for (const auto &e : edges) {
            cout << "ID " << setw(2) << e.id << " | R" << e.u << " <-> R" << e.v
                 << " | " << setw(3) << e.bandwidth_mbps << " Mbps (Cost=" << setw(2) << e.cost << ") | "
                 << (e.active ? "UP (Aktif)" : "DOWN (Mati)") << "\n";
        }
    }
};

int main(int argc, char *argv[]) {
    OSPFNetwork net;

    if (argc > 1 && string(argv[1]) == "--demo") {
        cout << ">>> SKENARIO 1: KONDISI NORMAL (SEMUA ROUTER & LINK AKTIF) <<<\n";
        net.runDijkstra(0, 9, true);

        cout << "\n>>> SKENARIO 2: LINK ATAS R4-R6 PUTUS (FAILOVER OTOMATIS) <<<\n";
        net.setEdgeStatus(7, false); // Matikan Link R4 - R6
        net.runDijkstra(0, 9, true);
        return 0;
    }

    int src = 0, dst = 9, choice;
    while (true) {
        cout << "\n======================================================\n";
        cout << "  MENU SIMULATOR OSPF SHORTEST PATH (BAHASA C++ STL)\n";
        cout << "======================================================\n";
        cout << "1. Hitung Jalur Terpendek (R" << src << " -> R" << dst << ") & Tabel Routing\n";
        cout << "2. Ubah Router Asal (Source) & Tujuan (Destination)\n";
        cout << "3. Lihat Status Topologi (Router & Link)\n";
        cout << "4. Matikan / Nyalakan Router (Toggle Node R0 - R9)\n";
        cout << "5. Matikan / Nyalakan Link Kabel (Toggle Edge 0 - 13)\n";
        cout << "6. Reset Semua Topologi ke Kondisi Normal (Semua ON)\n";
        cout << "0. Keluar\n";
        cout << "Pilihan Anda: ";

        if (!(cin >> choice) || choice == 0) break;

        if (choice == 1) {
            net.runDijkstra(src, dst, true);
        } else if (choice == 2) {
            cout << "Masukkan ID Router Asal (0-9): "; cin >> src;
            cout << "Masukkan ID Router Tujuan (0-9): "; cin >> dst;
            net.runDijkstra(src, dst, true);
        } else if (choice == 3) {
            net.printTopologyStatus();
        } else if (choice == 4) {
            int r;
            net.printTopologyStatus();
            cout << "Masukkan nomor Router yang ingin di-toggle (0-9): "; cin >> r;
            net.toggleNode(r);
            net.runDijkstra(src, dst, false);
        } else if (choice == 5) {
            int e;
            net.printTopologyStatus();
            cout << "Masukkan ID Link yang ingin di-toggle (0-13): "; cin >> e;
            net.toggleEdge(e);
            net.runDijkstra(src, dst, false);
        } else if (choice == 6) {
            net.resetAll();
            net.runDijkstra(src, dst, false);
        }
    }
    return 0;
}