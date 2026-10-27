#include <iostream>
#include <vector>
#include <queue>
#include <string>
#include <algorithm>
#include <iomanip>

using namespace std;

const int INF = 1e9;
const int REF_BANDWIDTH = 100; // Standar Default Cisco Packet Tracer: 100 Mbps (FastEthernet)

struct Kabel {
    int tujuan;
    int bandwidth; // dalam Mbps
    int cost;      // OSPF Cost = 100 / bandwidth
};

void tambahKabel(vector<vector<Kabel>>& adj, int u, int v, int bandwidth) {
    int cost = REF_BANDWIDTH / bandwidth;
    if (cost < 1) cost = 1; // Minimal OSPF cost di Cisco adalah 1

    adj[u].push_back({v, bandwidth, cost});
    adj[v].push_back({u, bandwidth, cost});
}

void cetakJalur(int awal, int tujuan, const vector<int>& parent, const vector<string>& namaRouter) {
    vector<int> rute;
    int sekarang = tujuan;

    while (sekarang != -1) {
        rute.push_back(sekarang);
        sekarang = parent[sekarang];
    }

    reverse(rute.begin(), rute.end());

    for (size_t i = 0; i < rute.size(); i++) {
        cout << "R" << rute[i] << " (" << namaRouter[rute[i]] << ")";
        if (i + 1 < rute.size()) cout << " -> ";
    }
}

// DFS: kumpulkan semua jalur sederhana (tanpa router berulang) dari sekarang ke akhir
static void cariSemuaJalur(int sekarang, int akhir, const vector<vector<Kabel>>& adj,
                           vector<bool>& dikunjungi, vector<int>& jalan, int costJalan,
                           vector<pair<int, vector<int>>>& hasil) {
    if (sekarang == akhir) {
        hasil.push_back({costJalan, jalan});
        return;
    }
    for (const auto& k : adj[sekarang]) {
        if (dikunjungi[k.tujuan]) continue;
        dikunjungi[k.tujuan] = true;
        jalan.push_back(k.tujuan);
        cariSemuaJalur(k.tujuan, akhir, adj, dikunjungi, jalan, costJalan + k.cost, hasil);
        jalan.pop_back();
        dikunjungi[k.tujuan] = false;
    }
}

// Menampilkan jalur tercepat dari router awal ke router akhir, beserta semua jalur alternatif
void tampilkanJalurTercepat(int awal, int akhir, int n, const vector<int>& totalCost,
                            const vector<int>& parent, const vector<vector<Kabel>>& adj,
                            const vector<string>& namaRouter) {
    cout << "\n=========================================================\n";
    cout << "JALUR TERCEPAT: R" << awal << " (" << namaRouter[awal] << ") -> R"
         << akhir << " (" << namaRouter[akhir] << ")\n";
    cout << "=========================================================\n";

    if (totalCost[akhir] == INF) {
        cout << "Status    : Jaringan Terputus (Unreachable)\n";
        return;
    }

    // Semua jalur yang mungkin dari awal ke akhir, urut dari cost terkecil
    vector<pair<int, vector<int>>> semuaJalur;
    vector<bool> dikunjungi(n, false);
    vector<int> jalan = {awal};
    dikunjungi[awal] = true;
    cariSemuaJalur(awal, akhir, adj, dikunjungi, jalan, 0, semuaJalur);
    sort(semuaJalur.begin(), semuaJalur.end());

    cout << "Ditemukan " << semuaJalur.size() << " kemungkinan jalur (urut dari tercepat):\n\n";
    cout << left << setw(6) << "No" << setw(8) << "Cost" << "Rute\n";
    cout << string(75, '-') << "\n";

    for (size_t k = 0; k < semuaJalur.size(); k++) {
        cout << left << setw(6) << (k + 1) << setw(8) << semuaJalur[k].first;
        const vector<int>& r = semuaJalur[k].second;
        for (size_t i = 0; i < r.size(); i++) {
            cout << "R" << r[i];
            if (i + 1 < r.size()) cout << " -> ";
        }
        if (semuaJalur[k].first == totalCost[akhir]) cout << "   << TERCEPAT";
        cout << "\n";
    }
}

void bangunTabelOSPF(int start, int akhir, int n, const vector<vector<Kabel>>& adj, const vector<string>& namaRouter) {
    vector<int> totalCost(n, INF);
    vector<int> parent(n, -1);

    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;

    totalCost[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        int costSekarang = pq.top().first;
        int u = pq.top().second;
        pq.pop();

        if (costSekarang > totalCost[u]) continue;

        for (const auto& kabel : adj[u]) {
            int v = kabel.tujuan;
            int costKabel = kabel.cost;

            if (totalCost[u] + costKabel < totalCost[v]) {
                totalCost[v] = totalCost[u] + costKabel;
                parent[v] = u;
                pq.push({totalCost[v], v});
            }
        }
    }

    cout << "\n=========================================================\n";
    cout << "TABEL ROUTING OSPF DARI R" << start << " (" << namaRouter[start] << ")\n";
    cout << "Reference Bandwidth: " << REF_BANDWIDTH << " Mbps (Standar Cisco Packet Tracer)\n";
    cout << "=========================================================\n";

    for (int i = 0; i < n; i++) {
        if (i == start) continue;

        cout << "\nTujuan    : R" << i << " (" << namaRouter[i] << ")\n";
        if (totalCost[i] == INF) {
            cout << "Status    : Jaringan Terputus (Unreachable)\n";
        } else {
            cout << "Total Cost: " << totalCost[i] << "\n";
            cout << "Rute SPF  : ";
            cetakJalur(start, i, parent, namaRouter);
            cout << "\n";
        }
    }

    // Menampilkan jalur tercepat dari router awal (start) ke router tujuan pilihan (akhir)
    tampilkanJalurTercepat(start, akhir, n, totalCost, parent, adj, namaRouter);
}

int main() {
    cout << "=========================================================\n";
    cout << "        SIMULASI ROUTING OSPF DINAMIS (INPUT/OUTPUT)     \n";
    cout << "=========================================================\n";

    int jumlahRouter;
    cout << "Masukkan jumlah router (minimal 2): ";
    while (!(cin >> jumlahRouter) || jumlahRouter < 2) {
        cout << "Input tidak valid! Masukkan jumlah router (minimal 2): ";
        cin.clear();
        cin.ignore(10000, '\n');
    }

    vector<string> namaRouter(jumlahRouter);
    char kustomNama;
    cout << "Apakah ingin menginput nama khusus untuk setiap router? (y/n): ";
    cin >> kustomNama;

    if (kustomNama == 'y' || kustomNama == 'Y') {
        for (int i = 0; i < jumlahRouter; i++) {
            cout << "Masukkan nama untuk R" << i << ": ";
            getline(cin >> ws, namaRouter[i]);
        }
    } else {
        for (int i = 0; i < jumlahRouter; i++) {
            namaRouter[i] = "Router " + to_string(i);
        }
    }

    vector<vector<Kabel>> adj(jumlahRouter);

    int jumlahKabel;
    cout << "\nMasukkan jumlah koneksi kabel: ";
    while (!(cin >> jumlahKabel) || jumlahKabel < 0) {
        cout << "Input tidak valid! Masukkan jumlah koneksi kabel (minimal 0): ";
        cin.clear();
        cin.ignore(10000, '\n');
    }

    cout << "\n--- Input Data Koneksi Kabel ---\n";
    cout << "Format: [Router_Asal] [Router_Tujuan] [Bandwidth_Mbps]\n";
    cout << "Contoh: 0 1 10 (artinya R0 terhubung ke R1 dengan bandwidth 10 Mbps)\n\n";

    for (int i = 0; i < jumlahKabel; i++) {
        int u, v, bw;
        while (true) {
            cout << "Kabel ke-" << (i + 1) << " (u v bandwidth): ";
            if (cin >> u >> v >> bw &&
                u >= 0 && u < jumlahRouter &&
                v >= 0 && v < jumlahRouter &&
                u != v && bw > 0) {
                tambahKabel(adj, u, v, bw);
                break;
            } else {
                cout << "  [!] Input tidak valid! Pastikan nomor router antara 0 s.d. "
                     << (jumlahRouter - 1) << ", router asal != tujuan, dan bandwidth > 0.\n";
                cin.clear();
                cin.ignore(10000, '\n');
            }
        }
    }

    char ulangi = 'y';
    while (ulangi == 'y' || ulangi == 'Y') {
        int routerAwal, routerAkhir;

        cout << "\n--- Pilih Router Awal dan Tujuan ---\n";
        while (true) {
            cout << "Masukkan nomor Router Awal (0 s.d. " << (jumlahRouter - 1) << ")  : ";
            if (cin >> routerAwal && routerAwal >= 0 && routerAwal < jumlahRouter) break;
            cout << "  [!] Nomor router tidak valid!\n";
            cin.clear();
            cin.ignore(10000, '\n');
        }

        while (true) {
            cout << "Masukkan nomor Router Tujuan (0 s.d. " << (jumlahRouter - 1) << "): ";
            if (cin >> routerAkhir && routerAkhir >= 0 && routerAkhir < jumlahRouter) break;
            cout << "  [!] Nomor router tidak valid!\n";
            cin.clear();
            cin.ignore(10000, '\n');
        }

        // Eksekusi perhitungan dan tampilkan output
        bangunTabelOSPF(routerAwal, routerAkhir, jumlahRouter, adj, namaRouter);

        cout << "\nApakah ingin mengecek rute untuk Router Awal/Tujuan lain? (y/n): ";
        cin >> ulangi;
    }

    cout << "\nProgram selesai. Terima kasih!\n";
    return 0;
}